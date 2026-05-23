import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  LinearProgress,
  Button,
  Divider,
  MenuItem
} from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import useRoadmapEngine from '../hooks/useRoadmapEngine';
import { useFeedback } from '../context/FeedbackContext';

export default function LearningRoadmap({ selectedJobRole, analysisResult }) {
  const { showSuccess, showError } = useFeedback();
  const skillIconSize = 20;
  const skillRowHorizontalPadding = 2;
  const missingSkills = analysisResult?.missingSkills || [];
  const {
    roadmap,
    overallProgress,
    weekProgress,
    submitSkillVerification,
    weightedProgress,
    readiness,
    domainAnalytics,
    isWeekCompleted,
    roadmapCompleted,
    completionSummary,
    initialized
  } = useRoadmapEngine({
    targetRole: selectedJobRole || analysisResult?.jobRole || 'Target Role',
    missingSkills
  });
  const [verificationOpen, setVerificationOpen] = React.useState(false);
  const [activeSkillRef, setActiveSkillRef] = React.useState(null);
  const [evidenceUrl, setEvidenceUrl] = React.useState('');
  const [evidenceNotes, setEvidenceNotes] = React.useState('');
  const [answers, setAnswers] = React.useState({ q1: '', q2: '', q3: '' });

  const openVerification = (weekId, skill) => {
    setActiveSkillRef({ weekId, skillId: skill.id, skillTitle: skill.title, difficulty: skill.difficulty });
    setEvidenceUrl(skill.evidenceUrl || '');
    setEvidenceNotes(skill.evidenceNotes || '');
    setAnswers({ q1: '', q2: '', q3: '' });
    setVerificationOpen(true);
  };

  const closeVerification = () => {
    setVerificationOpen(false);
    setActiveSkillRef(null);
  };

  const getQuizConfig = (difficulty) => {
    if (difficulty === 'beginner') {
      return {
        q1: { correct: 'b', label: 'What is the best way to build confidence in a beginner skill?', options: { a: 'Skip practice', b: 'Build small projects', c: 'Only read docs' } },
        q2: { correct: 'c', label: 'Which evidence is strongest for completion?', options: { a: 'No evidence', b: 'Only checkbox', c: 'Repo link and notes' } },
        q3: { correct: 'a', label: 'What should you do if stuck?', options: { a: 'Document blocker and next step', b: 'Mark complete anyway', c: 'Delete task' } }
      };
    }
    if (difficulty === 'advanced') {
      return {
        q1: { correct: 'c', label: 'Advanced readiness should include:', options: { a: 'No testing', b: 'Only theory', c: 'Implementation and validation' } },
        q2: { correct: 'b', label: 'Best production evidence is:', options: { a: 'Random screenshot', b: 'Repo + deployment + notes', c: 'Just duration spent' } },
        q3: { correct: 'a', label: 'If results are weak, you should:', options: { a: 'Revise and resubmit', b: 'Force complete', c: 'Skip to next week' } }
      };
    }
    return {
      q1: { correct: 'a', label: 'Skill verification should be based on:', options: { a: 'Evidence + understanding', b: 'Checkbox only', c: 'Time only' } },
      q2: { correct: 'c', label: 'Good submission includes:', options: { a: 'No context', b: 'One-word note', c: 'Proof link and reflection' } },
      q3: { correct: 'b', label: 'If quiz fails, task status should be:', options: { a: 'Verified', b: 'Needs revision', c: 'Deleted' } }
    };
  };

  const submitVerification = () => {
    if (!activeSkillRef) return;
    if (!evidenceNotes.trim() || evidenceNotes.trim().length < 25) {
      showError('Add at least 25 characters explaining what you completed.');
      return;
    }
    if (!answers.q1 || !answers.q2 || !answers.q3) {
      showError('Please answer all 3 verification questions.');
      return;
    }

    const quiz = getQuizConfig(activeSkillRef.difficulty);
    const correctCount =
      Number(answers.q1 === quiz.q1.correct) +
      Number(answers.q2 === quiz.q2.correct) +
      Number(answers.q3 === quiz.q3.correct);
    const score = Math.round((correctCount / 3) * 100);

    submitSkillVerification(activeSkillRef.weekId, activeSkillRef.skillId, {
      score,
      evidenceUrl: evidenceUrl.trim() || null,
      evidenceNotes: evidenceNotes.trim()
    });

    if (score >= 70) {
      showSuccess(`Verification passed (${score}%). Skill marked as verified.`);
    } else {
      showError(`Verification score ${score}%. Skill marked as needs revision.`);
    }
    closeVerification();
  };

  if (!initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if ((!analysisResult || !missingSkills.length) && (!roadmap || !roadmap.weeks?.length)) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            Run a Skill Gap Analysis first to generate your roadmap.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!roadmap || !roadmap.weeks || roadmap.weeks.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            No missing skills found. You are ready to apply.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Learning Roadmap
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {roadmap.targetRole}
              </Typography>
            </Box>
            <Chip
              label={`${readiness.readinessLevel} - ${readiness.readinessPercentage}%`}
              variant="outlined"
              sx={{ borderColor: 'primary.main', color: 'primary.main', fontWeight: 600 }}
            />
          </Box>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                Weighted Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {weightedProgress.weightedProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={weightedProgress.weightedProgress}
              sx={{ height: 8, borderRadius: 999, bgcolor: 'divider' }}
            />
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">Skills Completed</Typography>
              <Typography variant="body1">{overallProgress.completedSkills}/{overallProgress.totalSkills}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Overall Completion</Typography>
              <Typography variant="body1">{overallProgress.percentage}%</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Strongest Domain</Typography>
              <Typography variant="body1">{domainAnalytics.strongestDomain || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Weakest Domain</Typography>
              <Typography variant="body1">{domainAnalytics.weakestDomain || 'N/A'}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {roadmap.weeks.map((week) => {
            const progress = weekProgress[week.id] || { completedSkills: 0, totalSkills: 0, percentage: 0 };
            const completed = isWeekCompleted(week);

            return (
              <Box
                key={week.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: skillIconSize,
                          height: skillIconSize,
                          minWidth: skillIconSize,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {completed ? (
                          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <Typography variant="h6" sx={{ minWidth: 0 }}>
                        {week.title}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={completed ? 'Completed' : `${progress.percentage}%`}
                      sx={{ borderColor: 'divider', color: 'text.secondary' }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {week.goal}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{ mb: 1.5, height: 6, borderRadius: 999, bgcolor: 'divider' }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {week.skills.map((skill) => (
                      <Box
                        key={skill.id}
                        onClick={() => openVerification(week.id, skill)}
                        sx={{
                          px: skillRowHorizontalPadding,
                          py: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          bgcolor: 'transparent'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: skillIconSize,
                              height: skillIconSize,
                              minWidth: skillIconSize,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {skill.completed ? (
                              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            ) : (
                              <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            )}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: skill.completed ? 'text.secondary' : 'text.primary',
                                textDecoration: skill.completed ? 'line-through' : 'none'
                              }}
                            >
                              {skill.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {skill.domain} - {skill.difficulty} - {skill.estimatedHours}h
                              {skill.completedAt ? ` - Completed ${new Date(skill.completedAt).toLocaleDateString()}` : ''}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 40, textAlign: 'right', alignSelf: 'center' }}
                        >
                          {skill.verificationStatus === 'verified'
                            ? 'Verified'
                            : skill.verificationStatus === 'needs_revision'
                              ? 'Revise'
                              : 'Submit'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {roadmapCompleted && completionSummary && (
          <Box
            sx={{
              mt: 4,
              p: { xs: 2.5, sm: 3.5 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Completion Summary
            </Typography>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {completionSummary.roleReadiness}%
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {completionSummary.readinessLevel}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
                mb: 2
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Strongest Domain: {completionSummary.strongestDomain || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weakest Domain: {completionSummary.weakestDomain || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Skills Completed: {completionSummary.totalSkillsCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated Hours: {completionSummary.totalEstimatedHours}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {completionSummary.systemMessage}
            </Typography>

            <Button variant="contained" color="primary">
              Start Advanced Track
            </Button>
          </Box>
        )}

        <Dialog open={verificationOpen} onClose={closeVerification} fullWidth maxWidth="sm">
          <DialogTitle>Submit Verification Evidence</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Skill: {activeSkillRef?.skillTitle || 'N/A'}
            </Typography>

            <TextField
              label="Evidence URL (GitHub/demo, optional)"
              fullWidth
              size="small"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="What did you complete? (required)"
              fullWidth
              multiline
              minRows={3}
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            {activeSkillRef && (() => {
              const quiz = getQuizConfig(activeSkillRef.difficulty);
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {['q1', 'q2', 'q3'].map((key) => (
                    <Box key={key}>
                      <Typography variant="body2" sx={{ mb: 0.75 }}>{quiz[key].label}</Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={answers[key]}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                      >
                        {Object.entries(quiz[key].options).map(([optionKey, optionLabel]) => (
                          <MenuItem key={optionKey} value={optionKey}>
                            {optionLabel}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ))}
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeVerification}>Cancel</Button>
            <Button variant="contained" onClick={submitVerification}>Submit For Verification</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
