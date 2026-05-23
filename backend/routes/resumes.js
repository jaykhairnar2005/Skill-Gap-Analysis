const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');
const { verifyToken, asyncHandler } = require('../middleware/auth');
const { extractSkillsFromResume } = require('../utils/skillExtractor');

/* ===============================
   MULTER CONFIG
================================ */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        file.mimetype === 'application/pdf'
            ? cb(null, true)
            : cb(new Error('Only PDF files allowed'));
    }
});

/* ===============================
   PDF TEXT EXTRACTION
================================ */
async function extractTextFromPDF(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(' ') + '\n';
    }

    return text.trim();
}

/* ===============================
   UPLOAD RESUME
================================ */
router.post(
    '/upload',
    verifyToken,
    upload.single('resume'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Resume PDF file is required' });
        }

        const extractedText = await extractTextFromPDF(req.file.path);
        const extractionResult = await extractSkillsFromResume(extractedText, req.db);
        const extractedSkills = extractionResult.skills;

        console.log('Extracted skills:', extractedSkills);

        await req.db.query(
            `
            INSERT INTO resumes
            (user_id, file_name, file_path, extracted_skills, extracted_text)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            `,
            [
                req.user.userId,
                req.file.originalname,
                req.file.path,
                extractedSkills,
                extractedText
            ]
        );

        for (const skill of extractedSkills) {
            const skillLower = skill.toLowerCase();

            const skillRow = await req.db.query(
                'SELECT id FROM skills WHERE LOWER(name) = $1',
                [skillLower]
            );

            let skillId;
            if (skillRow.rows.length === 0) {
                const inserted = await req.db.query(
                    'INSERT INTO skills (name) VALUES ($1) RETURNING id',
                    [skill]
                );
                skillId = inserted.rows[0].id;
            } else {
                skillId = skillRow.rows[0].id;
            }

            await req.db.query(
                `
                INSERT INTO user_skills (user_id, skill_id, proficiency_level)
                VALUES ($1, $2, 'intermediate')
                ON CONFLICT (user_id, skill_id) DO NOTHING
                `,
                [req.user.userId, skillId]
            );
        }

        res.status(201).json({
            message: 'Resume uploaded successfully',
            extractedSkills,
            skillMatches: extractionResult.details
        });
    })
);

/* ===============================
   GET USER RESUMES
================================ */
router.get('/', verifyToken, asyncHandler(async (req, res) => {
    const result = await req.db.query(
        'SELECT id, file_name, extracted_skills FROM resumes WHERE user_id = $1 ORDER BY upload_date DESC, id DESC',
        [req.user.userId]
    );
    res.json(result.rows);
}));

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Max size is 5MB.' });
    }
    if (err && err.message === 'Only PDF files allowed') {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
