export function calculateWeekProgress(week) {
  const totalSkills = Array.isArray(week?.skills) ? week.skills.length : 0;
  const completedSkills = totalSkills === 0
    ? 0
    : week.skills.filter((skill) => skill.completed).length;
  const percentage = totalSkills === 0
    ? 0
    : Math.round((completedSkills / totalSkills) * 100);

  return {
    completedSkills,
    totalSkills,
    percentage
  };
}

export function calculateOverallProgress(roadmap) {
  const weeks = Array.isArray(roadmap?.weeks) ? roadmap.weeks : [];
  let totalSkills = 0;
  let completedSkills = 0;

  for (const week of weeks) {
    const weekProgress = calculateWeekProgress(week);
    totalSkills += weekProgress.totalSkills;
    completedSkills += weekProgress.completedSkills;
  }

  const percentage = totalSkills === 0
    ? 0
    : Math.round((completedSkills / totalSkills) * 100);

  return {
    completedSkills,
    totalSkills,
    percentage
  };
}

export function isWeekCompleted(week) {
  const { totalSkills, completedSkills } = calculateWeekProgress(week);
  return totalSkills > 0 && completedSkills === totalSkills;
}

export function isRoadmapCompleted(roadmap) {
  const { totalSkills, completedSkills } = calculateOverallProgress(roadmap);
  return totalSkills > 0 && completedSkills === totalSkills;
}

export function updateProgressHistory(progressHistory, percentage) {
  const history = Array.isArray(progressHistory) ? [...progressHistory] : [];
  const last = history[history.length - 1];

  if (last && last.percentage === percentage) {
    return history;
  }

  history.push({
    date: new Date().toISOString(),
    percentage
  });

  return history;
}

export function getCompletionSummary(roadmap) {
  const overall = calculateOverallProgress(roadmap);
  const weeks = Array.isArray(roadmap?.weeks) ? roadmap.weeks : [];
  const totalEstimatedHours = weeks
    .flatMap((week) => week.skills || [])
    .reduce((sum, skill) => sum + (Number(skill.estimatedHours) || 0), 0);
  const totalWeeksCompleted = weeks.filter((week) => isWeekCompleted(week)).length;

  return {
    totalSkillsLearned: overall.completedSkills,
    totalWeeksCompleted,
    totalEstimatedHours,
    finalPercentage: overall.percentage
  };
}
