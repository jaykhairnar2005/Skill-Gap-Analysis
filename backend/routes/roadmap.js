const express = require('express');
const router = express.Router();
const { verifyToken, asyncHandler } = require('../middleware/auth');

async function ensureVerificationTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS roadmap_skill_verifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_role VARCHAR(255) NOT NULL,
      week_id VARCHAR(100) NOT NULL,
      skill_id VARCHAR(150) NOT NULL,
      skill_title VARCHAR(255),
      verification_status VARCHAR(50) NOT NULL DEFAULT 'not_started',
      verification_score INTEGER,
      evidence_url TEXT,
      evidence_notes TEXT,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMP,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_skill_verification UNIQUE (user_id, target_role, week_id, skill_id)
    )
  `);
}

// ===============================
// CREATE ROADMAP
// ===============================
router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const { jobRoleId } = req.body;
  if (!jobRoleId) return res.status(400).json({ error: "Job role required" });

  const client = await req.db.connect();
  try {
    await client.query('BEGIN');

    const analysis = await client.query(
      `SELECT missing_skills
       FROM skill_gap_analysis
       WHERE user_id=$1 AND job_role_id=$2
       ORDER BY analysis_date DESC
       LIMIT 1`,
      [req.user.userId, jobRoleId]
    );

    if (analysis.rows.length === 0)
      return res.status(400).json({ error: "Run skill analysis first" });

    const skills = analysis.rows[0].missing_skills;

    const roadmapResult = await client.query(
      `INSERT INTO learning_roadmaps (user_id, job_role_id, title, timeline_weeks, status)
       VALUES ($1,$2,$3,12,'active')
       RETURNING *`,
      [req.user.userId, jobRoleId, "Learning Roadmap"]
    );

    const roadmap = roadmapResult.rows[0];

    let step = 1;
    for (const skill of skills) {
      await client.query(
        `INSERT INTO roadmap_steps
         (roadmap_id, step_number, title, description, duration_days, order_sequence)
         VALUES ($1,$2,$3,$4,7,$2)`,
        [roadmap.id, step, `Learn ${skill}`, `Practice ${skill}`]
      );
      step++;
    }

    await client.query('COMMIT');
    res.json({ message: "Roadmap created" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Failed to create roadmap" });
  } finally {
    client.release();
  }
}));

// ===============================
// GET ROADMAP FOR USER
// ===============================
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const roadmap = await req.db.query(
    `SELECT *
     FROM learning_roadmaps
     WHERE user_id=$1
     ORDER BY created_at DESC
     LIMIT 1`,
    [req.user.userId]
  );

  if (roadmap.rows.length === 0) return res.json(null);

  const steps = await req.db.query(
    `SELECT * FROM roadmap_steps
     WHERE roadmap_id=$1
     ORDER BY order_sequence`,
    [roadmap.rows[0].id]
  );

  res.json({
    ...roadmap.rows[0],
    steps: steps.rows
  });
}));

// ===============================
// TOGGLE STEP
// ===============================
router.put('/step/:id', verifyToken, asyncHandler(async (req, res) => {
  const result = await req.db.query(
    `UPDATE roadmap_steps rs
     SET completed = NOT rs.completed
     FROM learning_roadmaps lr
     WHERE rs.id = $1
       AND lr.id = rs.roadmap_id
       AND lr.user_id = $2
     RETURNING rs.id`,
    [req.params.id, req.user.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Step not found" });
  }

  res.json({ message: "Step updated" });
}));

// ===============================
// GET SKILL VERIFICATIONS
// ===============================
router.get('/verifications', verifyToken, asyncHandler(async (req, res) => {
  const targetRole = String(req.query.targetRole || '').trim();
  if (!targetRole) {
    return res.status(400).json({ error: 'targetRole query param is required' });
  }

  await ensureVerificationTable(req.db);

  const result = await req.db.query(
    `SELECT week_id, skill_id, verification_status, verification_score, evidence_url, evidence_notes, completed, completed_at, submitted_at
     FROM roadmap_skill_verifications
     WHERE user_id = $1 AND target_role = $2`,
    [req.user.userId, targetRole]
  );

  res.json({
    targetRole,
    verifications: result.rows
  });
}));

// ===============================
// UPSERT SKILL VERIFICATION
// ===============================
router.post('/verifications', verifyToken, asyncHandler(async (req, res) => {
  const {
    targetRole,
    weekId,
    skillId,
    skillTitle,
    verificationStatus,
    verificationScore,
    evidenceUrl,
    evidenceNotes,
    completed,
    completedAt,
    submittedAt
  } = req.body;

  if (!targetRole || !weekId || !skillId || !verificationStatus) {
    return res.status(400).json({ error: 'targetRole, weekId, skillId, and verificationStatus are required' });
  }

  await ensureVerificationTable(req.db);

  const result = await req.db.query(
    `INSERT INTO roadmap_skill_verifications
      (user_id, target_role, week_id, skill_id, skill_title, verification_status, verification_score, evidence_url, evidence_notes, completed, completed_at, submitted_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, target_role, week_id, skill_id)
     DO UPDATE SET
      skill_title = EXCLUDED.skill_title,
      verification_status = EXCLUDED.verification_status,
      verification_score = EXCLUDED.verification_score,
      evidence_url = EXCLUDED.evidence_url,
      evidence_notes = EXCLUDED.evidence_notes,
      completed = EXCLUDED.completed,
      completed_at = EXCLUDED.completed_at,
      submitted_at = EXCLUDED.submitted_at,
      updated_at = CURRENT_TIMESTAMP
     RETURNING id, verification_status, verification_score, completed, completed_at, submitted_at`,
    [
      req.user.userId,
      String(targetRole).trim(),
      String(weekId).trim(),
      String(skillId).trim(),
      skillTitle || null,
      verificationStatus,
      Number.isFinite(Number(verificationScore)) ? Number(verificationScore) : null,
      evidenceUrl || null,
      evidenceNotes || null,
      !!completed,
      completedAt || null,
      submittedAt || null
    ]
  );

  res.json({ verification: result.rows[0] });
}));

module.exports = router;
