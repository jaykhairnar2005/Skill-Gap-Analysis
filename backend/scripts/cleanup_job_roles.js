require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'skill_gap_analyzer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

const seedPath = path.join(__dirname, '../data/job_roles_seed.json');

function normalizeTitle(title) {
    return String(title || '').trim().toLowerCase();
}

function scoreRole(role, seedTitles) {
    let score = 0;
    if (seedTitles.has(normalizeTitle(role.title))) score += 100;
    if ((role.domain || '').toLowerCase() !== 'general') score += 10;
    score += Number(role.id || 0) / 1000000;
    return score;
}

async function cleanupJobRoles() {
    const client = await pool.connect();
    try {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        const seedTitles = new Set(
            seedData.flatMap((d) => (d.roles || []).map((r) => normalizeTitle(r.title)))
        );

        await client.query('BEGIN');

        const roleRows = await client.query(`
            SELECT id, title, COALESCE(domain, 'General') AS domain
            FROM job_roles
            ORDER BY id ASC
        `);

        const byTitle = new Map();
        for (const row of roleRows.rows) {
            const key = normalizeTitle(row.title);
            if (!byTitle.has(key)) byTitle.set(key, []);
            byTitle.get(key).push(row);
        }

        const referencedRoleIds = new Set();
        const refsFromAnalysis = await client.query('SELECT DISTINCT job_role_id FROM skill_gap_analysis WHERE job_role_id IS NOT NULL');
        for (const row of refsFromAnalysis.rows) referencedRoleIds.add(row.job_role_id);

        const refsFromRoadmaps = await client.query('SELECT DISTINCT job_role_id FROM learning_roadmaps WHERE job_role_id IS NOT NULL');
        for (const row of refsFromRoadmaps.rows) referencedRoleIds.add(row.job_role_id);

        const duplicateDeleteIds = [];
        let duplicateSkipped = 0;
        for (const roles of byTitle.values()) {
            if (roles.length <= 1) continue;
            const sorted = [...roles].sort((a, b) => scoreRole(b, seedTitles) - scoreRole(a, seedTitles));
            const keep = sorted[0];
            const remove = sorted.slice(1);
            const removable = [];
            for (const r of remove) {
                if (referencedRoleIds.has(r.id)) {
                    duplicateSkipped++;
                } else {
                    removable.push(r.id);
                    duplicateDeleteIds.push(r.id);
                }
            }
            if (removable.length > 0) {
                console.log(`Duplicate title: "${keep.title}" keeping id=${keep.id}, removing ${removable.join(', ')}`);
            }
        }

        let duplicateDeleted = 0;
        if (duplicateDeleteIds.length > 0) {
            const duplicateDeleteResult = await client.query(
                'DELETE FROM job_roles WHERE id = ANY($1::int[])',
                [duplicateDeleteIds]
            );
            duplicateDeleted = duplicateDeleteResult.rowCount;
        }

        const legacyGeneralRows = await client.query(
            `
            SELECT id
            FROM job_roles
            WHERE COALESCE(domain, 'General') = 'General'
              AND LOWER(TRIM(title)) <> ALL($1::text[])
            `,
            [Array.from(seedTitles)]
        );

        const legacyGeneralDeleteIds = legacyGeneralRows.rows
            .map((r) => r.id)
            .filter((id) => !referencedRoleIds.has(id));
        const legacyGeneralSkipped = legacyGeneralRows.rows.length - legacyGeneralDeleteIds.length;

        let legacyGeneralDeleted = 0;
        if (legacyGeneralDeleteIds.length > 0) {
            const legacyGeneralResult = await client.query(
            `
            DELETE FROM job_roles
            WHERE id = ANY($1::int[])
            `,
                [legacyGeneralDeleteIds]
            );
            legacyGeneralDeleted = legacyGeneralResult.rowCount;
        }

        await client.query('COMMIT');

        const finalCounts = await client.query(`
            SELECT COUNT(*)::int AS role_count,
                   COUNT(DISTINCT COALESCE(domain, 'General'))::int AS domain_count
            FROM job_roles
        `);

        console.log('\nCleanup complete');
        console.log(`Deleted duplicate roles: ${duplicateDeleted}`);
        console.log(`Skipped duplicate roles (referenced): ${duplicateSkipped}`);
        console.log(`Deleted legacy General roles: ${legacyGeneralDeleted}`);
        console.log(`Skipped legacy General roles (referenced): ${legacyGeneralSkipped}`);
        console.log(`Current role count: ${finalCounts.rows[0].role_count}`);
        console.log(`Current domain count: ${finalCounts.rows[0].domain_count}`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Cleanup failed:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

cleanupJobRoles();
