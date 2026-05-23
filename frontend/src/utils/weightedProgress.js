const DIFFICULTY_WEIGHT = {
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

function weightForSkill(skill) {
  return DIFFICULTY_WEIGHT[skill?.difficulty] || 1;
}

/**
 * @param {Array} skills
 * @returns {{ completedWeight: number, totalWeight: number, weightedProgress: number }}
 */
export function calculateWeightedProgress(skills) {
  const list = Array.isArray(skills) ? skills : [];
  const totalWeight = list.reduce((sum, skill) => sum + weightForSkill(skill), 0);
  const completedWeight = list
    .filter((skill) => !!skill.completed)
    .reduce((sum, skill) => sum + weightForSkill(skill), 0);

  const weightedProgress = totalWeight === 0
    ? 0
    : Math.round((completedWeight / totalWeight) * 100);

  return {
    completedWeight,
    totalWeight,
    weightedProgress
  };
}
