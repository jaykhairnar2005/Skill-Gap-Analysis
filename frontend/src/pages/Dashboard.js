import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Alert,
  Button,
  Skeleton
} from '@mui/material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

import ResumeUpload from '../components/ResumeUpload';
import SkillGapAnalysis from '../components/SkillGapAnalysis';
import LearningRoadmap from '../components/LearningRoadmap';
import AIAssistant from '../components/AIAssistant';

const ANALYSIS_STORAGE_KEY = 'dashboard_analysis_result';
const ROLE_STORAGE_KEY = 'dashboard_selected_job_role';

function TabPanel({ children, value, index }) {
  return (
    <div style={{ display: value === index ? 'block' : 'none' }}>
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );
}

export default function Dashboard({ user }) {
  const { showInfo } = useFeedback();
  const [tabValue, setTabValue] = useState(0);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await apiClient.get('/resumes');

      if (res.data && res.data.length > 0) {
        setCurrentResume(res.data[0]);
      }

    } catch (err) {
      const apiError = normalizeApiError(err, 'Failed to fetch resume data.');
      setError(apiError.userMessage);
      if (!apiError.retryable) {
        showInfo('Upload your resume to start skill analysis.');
      }
    } finally {
      setLoading(false);
    }
  }, [showInfo]);

  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);

      if (savedAnalysis) {
        setAnalysisResult(JSON.parse(savedAnalysis));
      }

      if (savedRole) {
        setSelectedJobRole(savedRole);
      }
    } catch (storageError) {
      console.warn('Failed to restore saved dashboard state', storageError);
    }

    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    try {
      if (analysisResult) {
        localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysisResult));
      } else {
        localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      }
    } catch (storageError) {
      console.warn('Failed to persist analysis result', storageError);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (selectedJobRole) {
      localStorage.setItem(ROLE_STORAGE_KEY, selectedJobRole);
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  }, [selectedJobRole]);

  const handleResumeUpload = (resume) => {
    setCurrentResume(resume);
    setAnalysisResult(null);
    setSelectedJobRole('');
    setTabValue(1); // auto go to analysis tab
  };

  const setActiveTab = (tabName) => {
    if (tabName === "roadmap") setTabValue(2);
    if (tabName === "analysis") setTabValue(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3">
          Welcome back, {user?.firstName || 'User'}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1, color: 'text.secondary' }}>
          Track your resume, analyze skill gaps, and follow your roadmap.
        </Typography>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Resume Upload" />
          <Tab label="Skill Analysis" />
          <Tab label="Learning Roadmap" />
        </Tabs>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading && (
            <Box sx={{ py: 2 }}>
              <Skeleton height={48} sx={{ mb: 1 }} />
              <Skeleton height={48} sx={{ mb: 1 }} />
              <Skeleton height={48} />
            </Box>
          )}

          {error && (
            <Alert severity="warning" sx={{ mb: 2 }} action={(
              <Button color="inherit" size="small" onClick={fetchResumes}>
                Retry
              </Button>
            )}>
              {error || 'No resume found yet. Please upload one.'}
            </Alert>
          )}

          {!loading && (
            <>
              <TabPanel value={tabValue} index={0}>
                <ResumeUpload onUpload={handleResumeUpload} />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <SkillGapAnalysis
                  resume={currentResume}
                  selectedJobRole={selectedJobRole}
                  setSelectedJobRole={setSelectedJobRole}
                  analysisResult={analysisResult}
                  setAnalysisResult={setAnalysisResult}
                  setActiveTab={setActiveTab}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <LearningRoadmap
                  selectedJobRole={selectedJobRole}
                  analysisResult={analysisResult}
                />
              </TabPanel>
            </>
          )}
        </CardContent>
      </Card>

      <AIAssistant
        selectedJobRole={selectedJobRole}
        analysisResult={analysisResult}
        resume={currentResume}
      />
    </Container>
  );
}
