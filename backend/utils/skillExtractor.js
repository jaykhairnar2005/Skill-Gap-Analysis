/**
 * Production-oriented resume skill extraction.
 *
 * Features:
 * - Case-insensitive matching
 * - Alias normalization (nodejs/node.js, reactjs/react.js, etc.)
 * - Regex boundary matching to reduce false positives
 * - Section-aware confidence scoring
 * - Optional DB-backed skill dictionary expansion
 */

const DEFAULT_CANONICAL_SKILLS = [
    'Java',
    'Python',
    'C++',
    'C#',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'HTML',
    'CSS',
    'SQL',
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Pandas',
    'NumPy',
    'Scikit-learn',
    'Machine Learning',
    'Deep Learning',
    'Statistics',
    'AWS',
    'Azure',
    'Google Cloud',
    'Docker',
    'Kubernetes',
    'Linux',
    'Git',
    'CI/CD',
    'DevOps',
    'TensorFlow',
    'PyTorch',
    'Django',
    'Flask',
    'REST API',
    'GraphQL'
];

const EXPLICIT_ALIASES = {
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    'node.js': 'Node.js',
    nodejs: 'Node.js',
    'node js': 'Node.js',
    reactjs: 'React',
    'react.js': 'React',
    'c plus plus': 'C++',
    cpp: 'C++',
    'c sharp': 'C#',
    postgresql: 'PostgreSQL',
    postgres: 'PostgreSQL',
    mongodb: 'MongoDB',
    mongo: 'MongoDB',
    sklearn: 'Scikit-learn',
    'scikit learn': 'Scikit-learn',
    'machine-learning': 'Machine Learning',
    'deep-learning': 'Deep Learning',
    'google cloud platform': 'Google Cloud',
    gcp: 'Google Cloud',
    'amazon web services': 'AWS',
    'rest apis': 'REST API',
    restful: 'REST API',
    'restful api': 'REST API',
    'ci cd': 'CI/CD'
};

const SECTION_HINTS = [
    { type: 'skills', regex: /^\s*(technical )?skills?\s*:?\s*$/i, bonus: 0.25 },
    { type: 'experience', regex: /^\s*(experience|work experience|employment|projects?)\s*:?\s*$/i, bonus: 0.15 },
    { type: 'education', regex: /^\s*(education|certifications?)\s*:?\s*$/i, bonus: 0.07 },
    { type: 'summary', regex: /^\s*(summary|profile|objective)\s*:?\s*$/i, bonus: 0.08 }
];

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedAliasMap = null;
let cachedUntil = 0;

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeAlias(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[_,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeResumeText(text) {
    return String(text || '')
        .replace(/\r/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

function generateAliasesForSkill(canonical) {
    const aliases = new Set();
    const base = normalizeAlias(canonical);
    if (!base) return aliases;

    aliases.add(base);
    aliases.add(base.replace(/\./g, ''));
    aliases.add(base.replace(/\./g, ' '));
    aliases.add(base.replace(/[-/]/g, ' '));
    aliases.add(base.replace(/\s+/g, ''));

    if (base === 'node.js') {
        aliases.add('node');
        aliases.add('node js');
        aliases.add('nodejs');
    }
    if (base === 'react') {
        aliases.add('reactjs');
        aliases.add('react.js');
    }
    if (base === 'rest api') {
        aliases.add('rest apis');
        aliases.add('restful api');
    }
    if (base === 'ci/cd') {
        aliases.add('ci cd');
    }

    return aliases;
}

function buildAliasMapFromSkills(skillNames) {
    const aliasMap = new Map();
    const canonicalSkills = new Set(DEFAULT_CANONICAL_SKILLS);

    for (const name of skillNames || []) {
        if (name && typeof name === 'string') {
            canonicalSkills.add(name.trim());
        }
    }

    for (const canonical of canonicalSkills) {
        const aliases = generateAliasesForSkill(canonical);
        for (const alias of aliases) {
            if (!aliasMap.has(alias)) {
                aliasMap.set(alias, canonical);
            }
        }
    }

    for (const [alias, canonical] of Object.entries(EXPLICIT_ALIASES)) {
        aliasMap.set(normalizeAlias(alias), canonical);
    }

    return aliasMap;
}

async function getSkillAliasMap(db) {
    const now = Date.now();
    if (cachedAliasMap && now < cachedUntil) {
        return cachedAliasMap;
    }

    let dbSkills = [];
    if (db && typeof db.query === 'function') {
        try {
            const result = await db.query('SELECT name FROM skills');
            dbSkills = result.rows.map((row) => row.name).filter(Boolean);
        } catch (err) {
            console.warn('Skill dictionary DB fetch failed, using defaults:', err.message);
        }
    }

    cachedAliasMap = buildAliasMapFromSkills(dbSkills);
    cachedUntil = now + CACHE_TTL_MS;
    return cachedAliasMap;
}

function detectSectionType(line, currentSection) {
    for (const hint of SECTION_HINTS) {
        if (hint.regex.test(line)) {
            return hint.type;
        }
    }
    return currentSection;
}

function sectionBonus(sectionType) {
    const hit = SECTION_HINTS.find((item) => item.type === sectionType);
    if (hit) return hit.bonus;
    return 0.05;
}

function findSkillMatches(text, aliasMap) {
    const normalized = normalizeResumeText(text);
    const lines = normalized.split('\n');
    const matchesByCanonical = new Map();

    const aliases = Array.from(aliasMap.keys()).sort((a, b) => b.length - a.length);
    const compiled = aliases.map((alias) => {
        const safeAlias = escapeRegex(alias).replace(/\s+/g, '\\s+');
        const pattern = new RegExp(`(^|[^a-zA-Z0-9#+])(${safeAlias})(?=$|[^a-zA-Z0-9#+])`, 'ig');
        return { alias, canonical: aliasMap.get(alias), pattern };
    });

    let currentSection = 'other';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        currentSection = detectSectionType(line, currentSection);

        for (const item of compiled) {
            item.pattern.lastIndex = 0;
            let result = item.pattern.exec(line);
            while (result) {
                const canonical = item.canonical;
                if (!matchesByCanonical.has(canonical)) {
                    matchesByCanonical.set(canonical, []);
                }

                matchesByCanonical.get(canonical).push({
                    alias: item.alias,
                    context: line.slice(0, 200),
                    section: currentSection
                });
                result = item.pattern.exec(line);
            }
        }
    }

    const details = Array.from(matchesByCanonical.entries()).map(([skill, hits]) => {
        const occurrences = hits.length;
        const maxSectionBonus = Math.max(...hits.map((hit) => sectionBonus(hit.section)));
        const exactAliasBonus = hits.some((hit) => normalizeAlias(skill) === hit.alias) ? 0.05 : 0;
        const score = Math.min(0.95, 0.55 + occurrences * 0.08 + maxSectionBonus + exactAliasBonus);

        return {
            skill,
            confidence: Number(score.toFixed(2)),
            occurrences,
            sourceText: hits[0].context
        };
    });

    details.sort((a, b) => b.confidence - a.confidence || b.occurrences - a.occurrences);
    return details;
}

async function extractSkillsFromResume(text, db) {
    const aliasMap = await getSkillAliasMap(db);
    const details = findSkillMatches(text, aliasMap);
    return {
        skills: details.map((item) => item.skill),
        details
    };
}

module.exports = {
    extractSkillsFromResume
};
