function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function readinessLevelFromScore(score) {
  if (score >= 90) return 'Production Ready';
  if (score >= 70) return 'Interview Ready';
  if (score >= 40) return 'Developing';
  return 'Foundation Building';
}

/**
 * @param {Array} skills
 * @param {{ beginner: number, intermediate: number, advanced: number }} roleRequirements
 * @returns {{
 *  readinessPercentage: number,
 *  readinessLevel: string,
 *  completedByDifficulty: { beginner: number, intermediate: number, advanced: number },
 *  requiredByDifficulty: { beginner: number, intermediate: number, advanced: number }
 * }}
 */
export function calculateRoleReadiness(skills, roleRequirements) {
  const list = Array.isArray(skills) ? skills : [];
  const completedByDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };

  for (const skill of list) {
    if (!skill?.completed) continue;
    if (skill.difficulty in completedByDifficulty) {
      completedByDifficulty[skill.difficulty] += 1;
    }
  }

  const requiredByDifficulty = {
    beginner: toNumber(roleRequirements?.beginner),
    intermediate: toNumber(roleRequirements?.intermediate),
    advanced: toNumber(roleRequirements?.advanced)
  };

  const scoreBeginner = Math.min(completedByDifficulty.beginner, requiredByDifficulty.beginner);
  const scoreIntermediate = Math.min(completedByDifficulty.intermediate, requiredByDifficulty.intermediate);
  const scoreAdvanced = Math.min(completedByDifficulty.advanced, requiredByDifficulty.advanced);

  const scoredTotal = scoreBeginner + scoreIntermediate + scoreAdvanced;
  const requiredTotal =
    requiredByDifficulty.beginner +
    requiredByDifficulty.intermediate +
    requiredByDifficulty.advanced;

  const readinessPercentage = requiredTotal === 0
    ? 0
    : Math.round((scoredTotal / requiredTotal) * 100);

  return {
    readinessPercentage,
    readinessLevel: readinessLevelFromScore(readinessPercentage),
    completedByDifficulty,
    requiredByDifficulty
  };
}
