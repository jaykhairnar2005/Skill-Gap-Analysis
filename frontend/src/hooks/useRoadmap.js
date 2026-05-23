import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoadmapFromMissingSkills } from '../models/roadmap';
import {
  calculateOverallProgress,
  calculateWeekProgress,
  getCompletionSummary,
  isRoadmapCompleted,
  isWeekCompleted,
  updateProgressHistory
} from '../utils/progress';

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
  return `roadmap_state_v2_${userId}_${roleKey}`;
}

function getExistingCompletionMap(roadmap) {
  const map = new Map();
  for (const week of roadmap?.weeks || []) {
    for (const skill of week.skills || []) {
      map.set(normalizeSkillKey(skill.title), {
        completed: !!skill.completed,
        completedAt: skill.completedAt || null
      });
    }
  }
  return map;
}

function mergeCompletionState(roadmap, completionMap) {
  const weeks = (roadmap.weeks || []).map((week) => ({
    ...week,
    skills: (week.skills || []).map((skill) => {
      const previous = completionMap.get(normalizeSkillKey(skill.title));
      return previous
        ? { ...skill, completed: previous.completed, completedAt: previous.completedAt }
        : skill;
    })
  }));

  const merged = { ...roadmap, weeks };
  const overall = calculateOverallProgress(merged);
  return {
    ...merged,
    progressHistory: updateProgressHistory(merged.progressHistory, overall.percentage)
  };
}

export default function useRoadmap({ targetRole, missingSkills }) {
  const storageKey = useMemo(() => buildStorageKey(targetRole), [targetRole]);
  const [roadmap, setRoadmap] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setRoadmap(JSON.parse(raw));
      } else {
        setRoadmap(null);
      }
    } catch (err) {
      console.warn('Failed to load roadmap state:', err);
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
  }, [roadmap, storageKey, initialized]);

  useEffect(() => {
    if (!initialized) return;
    const normalizedMissing = Array.isArray(missingSkills)
      ? missingSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (normalizedMissing.length === 0) return;

    const next = createRoadmapFromMissingSkills({
      targetRole,
      missingSkills: normalizedMissing
    });

    if (!roadmap) {
      setRoadmap(next);
      return;
    }

    const currentKeys = new Set(
      (roadmap.weeks || []).flatMap((week) => week.skills || []).map((s) => normalizeSkillKey(s.title))
    );
    const nextKeys = new Set(
      (next.weeks || []).flatMap((week) => week.skills || []).map((s) => normalizeSkillKey(s.title))
    );

    const sameShape = currentKeys.size === nextKeys.size && [...currentKeys].every((k) => nextKeys.has(k));
    if (sameShape) return;

    const merged = mergeCompletionState(next, getExistingCompletionMap(roadmap));
    setRoadmap(merged);
  }, [targetRole, missingSkills, initialized, roadmap]); // keep missingSkills-driven generation

  const toggleSkill = useCallback((weekId, skillId) => {
    setRoadmap((prev) => {
      if (!prev) return prev;

      const updatedWeeks = (prev.weeks || []).map((week) => {
        if (week.id !== weekId) return week;
        return {
          ...week,
          skills: (week.skills || []).map((skill) => {
            if (skill.id !== skillId) return skill;
            const nextCompleted = !skill.completed;
            return {
              ...skill,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null
            };
          })
        };
      });

      const nextRoadmap = { ...prev, weeks: updatedWeeks };
      const overall = calculateOverallProgress(nextRoadmap);

      return {
        ...nextRoadmap,
        progressHistory: updateProgressHistory(nextRoadmap.progressHistory, overall.percentage)
      };
    });
  }, []);

  const weekProgress = useMemo(() => {
    if (!roadmap?.weeks) return {};
    return roadmap.weeks.reduce((acc, week) => {
      acc[week.id] = calculateWeekProgress(week);
      return acc;
    }, {});
  }, [roadmap]);

  const overallProgress = useMemo(
    () => calculateOverallProgress(roadmap),
    [roadmap]
  );

  const roadmapCompleted = useMemo(
    () => isRoadmapCompleted(roadmap),
    [roadmap]
  );

  const completionSummary = useMemo(
    () => (roadmapCompleted ? getCompletionSummary(roadmap) : null),
    [roadmap, roadmapCompleted]
  );

  const isWeekDone = useCallback(
    (week) => isWeekCompleted(week),
    []
  );

  return {
    roadmap,
    overallProgress,
    weekProgress,
    toggleSkill,
    isWeekDone,
    roadmapCompleted,
    completionSummary,
    initialized
  };
}
