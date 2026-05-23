import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoadmapFromMissingSkills, flattenRoadmapSkills } from '../models/roadmap';
import { calculateWeightedProgress } from '../utils/weightedProgress';
import { calculateRoleReadiness } from '../utils/readiness';
import { calculateSkillStrength } from '../utils/domainAnalytics';
import apiClient from '../services/apiClient';

function normalizeSkillKey(skillTitle) {
  return String(skillTitle || '').trim().toLowerCase();
}

function buildStorageKey(targetRole) {
  const rawUser = localStorage.getItem('user');
  let userId = 'anon';
  try {
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (user?.id) userId = String(user.id);
  } catch (err) {
    userId = 'anon';
  }
  const roleKey = String(targetRole || 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  return `roadmap_engine_v1_${userId}_${roleKey}`;
}

function calculateWeekProgress(week) {
  const skills = Array.isArray(week?.skills) ? week.skills : [];
  const totalSkills = skills.length;
  const completedSkills = skills.filter((skill) => !!skill.completed).length;
  const percentage = totalSkills === 0 ? 0 : Math.round((completedSkills / totalSkills) * 100);
  return { completedSkills, totalSkills, percentage };
}

function calculateOverallProgress(roadmap) {
  const skills = flattenRoadmapSkills(roadmap);
  const totalSkills = skills.length;
  const completedSkills = skills.filter((skill) => !!skill.completed).length;
  const percentage = totalSkills === 0 ? 0 : Math.round((completedSkills / totalSkills) * 100);
  return { completedSkills, totalSkills, percentage };
}

function isWeekCompleted(week) {
  const weekProgress = calculateWeekProgress(week);
  return weekProgress.totalSkills > 0 && weekProgress.completedSkills === weekProgress.totalSkills;
}

function isRoadmapCompleted(roadmap) {
  const overall = calculateOverallProgress(roadmap);
  return overall.totalSkills > 0 && overall.completedSkills === overall.totalSkills;
}

function getExistingCompletionMap(roadmap) {
  const map = new Map();
  for (const week of roadmap?.weeks || []) {
    for (const skill of week.skills || []) {
      map.set(normalizeSkillKey(skill.title), {
        completed: !!skill.completed,
        completedAt: skill.completedAt || null,
        verificationStatus: skill.verificationStatus || (skill.completed ? 'verified' : 'not_started'),
        evidenceUrl: skill.evidenceUrl || null,
        evidenceNotes: skill.evidenceNotes || null,
        verificationScore: skill.verificationScore || null,
        submittedAt: skill.submittedAt || null
      });
    }
  }
  return map;
}

function buildProgressPoint(roadmap) {
  const skills = flattenRoadmapSkills(roadmap);
  const weighted = calculateWeightedProgress(skills);
  const readiness = calculateRoleReadiness(skills, roadmap?.roleRequirements || {});
  return {
    date: new Date().toISOString(),
    weightedProgress: weighted.weightedProgress,
    readinessScore: readiness.readinessPercentage
  };
}

function updateProgressHistory(progressHistory, nextPoint) {
  const history = Array.isArray(progressHistory) ? [...progressHistory] : [];
  const last = history[history.length - 1];
  if (
    last &&
    last.weightedProgress === nextPoint.weightedProgress &&
    last.readinessScore === nextPoint.readinessScore
  ) {
    return history;
  }
  history.push(nextPoint);
  return history;
}

function mergeCompletionState(roadmap, completionMap) {
  const weeks = (roadmap.weeks || []).map((week) => ({
    ...week,
    skills: (week.skills || []).map((skill) => {
      const previous = completionMap.get(normalizeSkillKey(skill.title));
      return previous
        ? {
          ...skill,
          completed: previous.completed,
          completedAt: previous.completedAt,
          verificationStatus: previous.verificationStatus,
          evidenceUrl: previous.evidenceUrl,
          evidenceNotes: previous.evidenceNotes,
          verificationScore: previous.verificationScore,
          submittedAt: previous.submittedAt
        }
        : skill;
    })
  }));

  const merged = { ...roadmap, weeks };
  return {
    ...merged,
    progressHistory: updateProgressHistory(merged.progressHistory, buildProgressPoint(merged))
  };
}

function applyServerVerifications(roadmap, verifications) {
  if (!roadmap || !Array.isArray(verifications) || verifications.length === 0) {
    return roadmap;
  }

  const bySkill = new Map(
    verifications.map((item) => [`${item.week_id}::${item.skill_id}`, item])
  );

  const weeks = (roadmap.weeks || []).map((week) => ({
    ...week,
    skills: (week.skills || []).map((skill) => {
      const matched = bySkill.get(`${week.id}::${skill.id}`);
      if (!matched) return skill;
      return {
        ...skill,
        completed: !!matched.completed,
        completedAt: matched.completed_at || null,
        verificationStatus: matched.verification_status || (matched.completed ? 'verified' : 'not_started'),
        evidenceUrl: matched.evidence_url || null,
        evidenceNotes: matched.evidence_notes || null,
        verificationScore: matched.verification_score || null,
        submittedAt: matched.submitted_at || null
      };
    })
  }));

  const nextRoadmap = { ...roadmap, weeks };
  return {
    ...nextRoadmap,
    progressHistory: updateProgressHistory(nextRoadmap.progressHistory, buildProgressPoint(nextRoadmap))
  };
}

function calculateImprovementTrend(progressHistory) {
  const history = Array.isArray(progressHistory) ? progressHistory : [];
  if (history.length < 3) return 'Insufficient data';

  const deltas = [];
  for (let i = 1; i < history.length; i += 1) {
    deltas.push(history[i].weightedProgress - history[i - 1].weightedProgress);
  }

  const firstDelta = deltas[0];
  const lastDelta = deltas[deltas.length - 1];
  if (lastDelta > firstDelta + 5) return 'Accelerating';
  if (lastDelta < firstDelta - 5) return 'Decelerating';
  return 'Stable';
}

function buildCompletionSummary(roadmap) {
  const skills = flattenRoadmapSkills(roadmap);
  const weighted = calculateWeightedProgress(skills);
  const readiness = calculateRoleReadiness(skills, roadmap.roleRequirements || {});
  const strength = calculateSkillStrength(skills);
  const weeks = roadmap.weeks || [];
  const totalEstimatedHours = skills.reduce((sum, skill) => sum + (Number(skill.estimatedHours) || 0), 0);
  const totalWeeksCompleted = weeks.filter((week) => isWeekCompleted(week)).length;
  const improvementTrend = calculateImprovementTrend(roadmap.progressHistory);

  const systemMessage =
    `You have successfully completed your structured roadmap.\n` +
    `Your role readiness score is ${readiness.readinessPercentage}%.\n` +
    `Current readiness level: ${readiness.readinessLevel}.\n` +
    `Strongest domain: ${strength.strongestDomain || 'N/A'}.\n` +
    `Recommended next focus: ${strength.weakestDomain || 'N/A'} improvement.`;

  return {
    totalSkillsCompleted: skills.filter((skill) => skill.completed).length,
    totalWeeksCompleted,
    totalEstimatedHours,
    weightedProgress: weighted.weightedProgress,
    roleReadiness: readiness.readinessPercentage,
    readinessLevel: readiness.readinessLevel,
    strongestDomain: strength.strongestDomain,
    weakestDomain: strength.weakestDomain,
    improvementTrend,
    systemMessage
  };
}

export default function useRoadmapEngine({ targetRole, missingSkills }) {
  const storageKey = useMemo(() => buildStorageKey(targetRole), [targetRole]);
  const [roadmap, setRoadmap] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setRoadmap(raw ? JSON.parse(raw) : null);
    } catch (err) {
      console.warn('Failed to load roadmap engine state:', err);
      setRoadmap(null);
    } finally {
      setInitialized(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!initialized) return;
    if (!roadmap) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(roadmap));
  }, [roadmap, initialized, storageKey]);

  useEffect(() => {
    const fetchServerVerifications = async () => {
      if (!initialized || !targetRole || !roadmap?.id) return;
      try {
        const response = await apiClient.get('/roadmap/verifications', {
          params: { targetRole }
        });
        if (response.data?.verifications?.length) {
          setRoadmap((prev) => applyServerVerifications(prev, response.data.verifications));
        }
      } catch (error) {
        // Keep local roadmap state if server sync fails.
      }
    };

    fetchServerVerifications();
  }, [initialized, targetRole, roadmap?.id]);

  useEffect(() => {
    if (!initialized) return;
    const normalizedMissing = Array.isArray(missingSkills)
      ? missingSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];
    if (normalizedMissing.length === 0) return;

    const nextRoadmap = createRoadmapFromMissingSkills({
      targetRole,
      missingSkills: normalizedMissing
    });

    if (!roadmap) {
      const withHistory = {
        ...nextRoadmap,
        progressHistory: updateProgressHistory(nextRoadmap.progressHistory, buildProgressPoint(nextRoadmap))
      };
      setRoadmap(withHistory);
      return;
    }

    const currentKeys = new Set(flattenRoadmapSkills(roadmap).map((skill) => normalizeSkillKey(skill.title)));
    const nextKeys = new Set(flattenRoadmapSkills(nextRoadmap).map((skill) => normalizeSkillKey(skill.title)));
    const sameShape = currentKeys.size === nextKeys.size && [...currentKeys].every((k) => nextKeys.has(k));
    if (sameShape) return;

    setRoadmap(mergeCompletionState(nextRoadmap, getExistingCompletionMap(roadmap)));
  }, [initialized, targetRole, missingSkills, roadmap]);

  const submitSkillVerification = useCallback(async (weekId, skillId, verificationInput) => {
    let payloadForServer = null;

    setRoadmap((prev) => {
      if (!prev) return prev;
      const score = Number(verificationInput?.score || 0);
      const passed = score >= 70;

      const weeks = (prev.weeks || []).map((week) => {
        if (week.id !== weekId) return week;
        return {
          ...week,
          skills: (week.skills || []).map((skill) => {
            if (skill.id !== skillId) return skill;
            return {
              ...skill,
              completed: passed,
              completedAt: passed ? new Date().toISOString() : null,
              verificationStatus: passed ? 'verified' : 'needs_revision',
              evidenceUrl: verificationInput?.evidenceUrl || null,
              evidenceNotes: verificationInput?.evidenceNotes || null,
              verificationScore: score,
              submittedAt: new Date().toISOString()
            };
          })
        };
      });
      const nextRoadmap = { ...prev, weeks };
      const selectedWeek = weeks.find((week) => week.id === weekId);
      const selectedSkill = selectedWeek?.skills?.find((skill) => skill.id === skillId);
      payloadForServer = selectedSkill
        ? {
          targetRole: nextRoadmap.targetRole,
          weekId,
          skillId,
          skillTitle: selectedSkill.title,
          verificationStatus: selectedSkill.verificationStatus,
          verificationScore: selectedSkill.verificationScore,
          evidenceUrl: selectedSkill.evidenceUrl,
          evidenceNotes: selectedSkill.evidenceNotes,
          completed: selectedSkill.completed,
          completedAt: selectedSkill.completedAt,
          submittedAt: selectedSkill.submittedAt
        }
        : null;

      return {
        ...nextRoadmap,
        progressHistory: updateProgressHistory(nextRoadmap.progressHistory, buildProgressPoint(nextRoadmap))
      };
    });

    if (payloadForServer) {
      try {
        await apiClient.post('/roadmap/verifications', payloadForServer);
      } catch (error) {
        // Keep local data; server sync can be retried on next save.
      }
    }
  }, []);

  const skills = useMemo(() => flattenRoadmapSkills(roadmap), [roadmap]);
  const weekProgress = useMemo(() => {
    if (!roadmap?.weeks) return {};
    return roadmap.weeks.reduce((acc, week) => {
      acc[week.id] = calculateWeekProgress(week);
      return acc;
    }, {});
  }, [roadmap]);
  const overallProgress = useMemo(() => calculateOverallProgress(roadmap), [roadmap]);
  const weightedProgress = useMemo(() => calculateWeightedProgress(skills), [skills]);
  const readiness = useMemo(
    () => calculateRoleReadiness(skills, roadmap?.roleRequirements || {}),
    [skills, roadmap]
  );
  const domainAnalytics = useMemo(() => calculateSkillStrength(skills), [skills]);

  const roadmapCompleted = useMemo(() => isRoadmapCompleted(roadmap), [roadmap]);
  const completionSummary = useMemo(
    () => (roadmapCompleted ? buildCompletionSummary(roadmap) : null),
    [roadmapCompleted, roadmap]
  );

  return {
    roadmap,
    initialized,
    submitSkillVerification,
    weekProgress,
    overallProgress,
    weightedProgress,
    readiness,
    domainAnalytics,
    isWeekCompleted,
    isRoadmapCompleted,
    roadmapCompleted,
    completionSummary
  };
}
