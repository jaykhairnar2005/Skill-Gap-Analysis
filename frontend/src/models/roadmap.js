/**
 * @typedef {Object} Skill
 * @property {string} id
 * @property {string} title
 * @property {string} domain
 * @property {string} description
 * @property {'beginner'|'intermediate'|'advanced'} difficulty
 * @property {number} estimatedHours
 * @property {boolean} completed
 * @property {string|null} completedAt
 * @property {'not_started'|'submitted'|'verified'|'needs_revision'} verificationStatus
 * @property {string|null} evidenceUrl
 * @property {string|null} evidenceNotes
 * @property {number|null} verificationScore
 * @property {string|null} submittedAt
 */

/**
 * @typedef {Object} Week
 * @property {string} id
 * @property {string} title
 * @property {string} goal
 * @property {Skill[]} skills
 * @property {number} order
 */

/**
 * @typedef {Object} Roadmap
 * @property {string} id
 * @property {string} targetRole
 * @property {string} createdAt
 * @property {{ beginner: number, intermediate: number, advanced: number }} roleRequirements
 * @property {Week[]} weeks
 * @property {{ date: string, weightedProgress: number, readinessScore: number }[]} progressHistory
 */

const FOUNDATION_SKILLS = new Set([
  'html',
  'css',
  'javascript',
  'typescript',
  'python',
  'java',
  'sql',
  'git',
  'linux',
  'statistics',
  'excel'
]);

const ADVANCED_SKILLS = new Set([
  'kubernetes',
  'terraform',
  'pytorch',
  'tensorflow',
  'mlops',
  'system design',
  'distributed systems',
  'microservices',
  'cloud architecture',
  'security architecture',
  'machine learning'
]);

const HOURS_BY_DIFFICULTY = {
  beginner: 10,
  intermediate: 16,
  advanced: 24
};

const DOMAIN_RULES = [
  { domain: 'Programming', keywords: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'ruby', 'php'] },
  { domain: 'Frontend', keywords: ['html', 'css', 'react', 'angular', 'vue', 'redux', 'tailwind'] },
  { domain: 'Backend', keywords: ['node', 'express', 'api', 'graphql', 'microservices', 'django', 'flask', 'spring'] },
  { domain: 'Data', keywords: ['sql', 'statistics', 'pandas', 'numpy', 'etl', 'warehouse', 'analytics'] },
  { domain: 'AI/ML', keywords: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'mlops', 'nlp'] },
  { domain: 'Cloud/DevOps', keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'devops'] },
  { domain: 'Security', keywords: ['security', 'siem', 'penetration', 'threat', 'compliance'] },
  { domain: 'Product/Business', keywords: ['product', 'stakeholder', 'roadmap', 'strategy', 'analysis'] }
];

function normalizeSkillTitle(skill) {
  return String(skill || '').trim();
}

function normalizeSkillKey(skill) {
  return normalizeSkillTitle(skill).toLowerCase();
}

function inferDifficulty(skillTitle) {
  const key = normalizeSkillKey(skillTitle);
  if (FOUNDATION_SKILLS.has(key)) return 'beginner';
  if (ADVANCED_SKILLS.has(key)) return 'advanced';
  return 'intermediate';
}

function inferDomain(skillTitle) {
  const key = normalizeSkillKey(skillTitle);
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some((keyword) => key.includes(keyword))) {
      return rule.domain;
    }
  }
  return 'General';
}

function getSkillDescription(skillTitle, difficulty) {
  if (difficulty === 'beginner') {
    return `Build fundamentals in ${skillTitle} and complete guided practice tasks.`;
  }
  if (difficulty === 'advanced') {
    return `Develop production-ready depth in ${skillTitle} through advanced implementation and optimization.`;
  }
  return `Develop practical implementation proficiency in ${skillTitle}.`;
}

function toSkill(skillTitle) {
  const title = normalizeSkillTitle(skillTitle);
  const difficulty = inferDifficulty(title);
  return {
    id: `skill_${normalizeSkillKey(title).replace(/[^a-z0-9]+/g, '_')}`,
    title,
    domain: inferDomain(title),
    description: getSkillDescription(title, difficulty),
    difficulty,
    estimatedHours: HOURS_BY_DIFFICULTY[difficulty],
    completed: false,
    completedAt: null,
    verificationStatus: 'not_started',
    evidenceUrl: null,
    evidenceNotes: null,
    verificationScore: null,
    submittedAt: null
  };
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function weekGoalForSkills(weekSkills) {
  const difficultyTypes = new Set(weekSkills.map((skill) => skill.difficulty));
  if (difficultyTypes.size === 1 && difficultyTypes.has('beginner')) {
    return 'Build core foundations and complete baseline implementation tasks.';
  }
  if (difficultyTypes.has('advanced')) {
    return 'Consolidate advanced execution and production readiness for high-impact skills.';
  }
  return 'Strengthen intermediate capability and practical confidence across target skills.';
}

function buildWeeks(sortedSkills, maxSkillsPerWeek) {
  return chunkArray(sortedSkills, maxSkillsPerWeek).map((skills, index) => ({
    id: `week_${index + 1}`,
    title: `Week ${index + 1}`,
    goal: weekGoalForSkills(skills),
    skills,
    order: index + 1
  }));
}

function uniqueMissingSkills(missingSkills) {
  const seen = new Set();
  const unique = [];
  for (const raw of missingSkills || []) {
    const title = normalizeSkillTitle(raw);
    const key = normalizeSkillKey(raw);
    if (!title || seen.has(key)) continue;
    seen.add(key);
    unique.push(title);
  }
  return unique;
}

function groupByDifficulty(skills) {
  const grouped = { beginner: [], intermediate: [], advanced: [] };
  for (const skill of skills) grouped[skill.difficulty].push(skill);
  return grouped;
}

function roleRequirementsFromSkills(skills) {
  const grouped = groupByDifficulty(skills);
  return {
    beginner: grouped.beginner.length,
    intermediate: grouped.intermediate.length,
    advanced: grouped.advanced.length
  };
}

/**
 * @param {Roadmap|null|undefined} roadmap
 * @returns {Skill[]}
 */
export function flattenRoadmapSkills(roadmap) {
  return (roadmap?.weeks || []).flatMap((week) => week.skills || []);
}

/**
 * @param {{ targetRole: string, missingSkills: string[], maxSkillsPerWeek?: number }} params
 * @returns {Roadmap}
 */
export function createRoadmapFromMissingSkills({
  targetRole,
  missingSkills,
  maxSkillsPerWeek = 3
}) {
  const cleanSkills = uniqueMissingSkills(missingSkills).map(toSkill);
  const grouped = groupByDifficulty(cleanSkills);
  const orderedSkills = [...grouped.beginner, ...grouped.intermediate, ...grouped.advanced];
  const weeks = buildWeeks(orderedSkills, Math.max(1, maxSkillsPerWeek));
  const createdAt = new Date().toISOString();

  return {
    id: `roadmap_${Date.now()}`,
    targetRole: String(targetRole || 'Target Role'),
    createdAt,
    roleRequirements: roleRequirementsFromSkills(cleanSkills),
    weeks,
    progressHistory: []
  };
}
