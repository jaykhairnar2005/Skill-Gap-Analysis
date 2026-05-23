import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

export default function SkillGapAnalysis({
  resume,
  selectedJobRole,
  setSelectedJobRole,
  analysisResult,
  setAnalysisResult,
  setActiveTab
}) {
  const { showSuccess, showError } = useFeedback();
  const [domainData, setDomainData] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [error, setError] = useState('');
  const [roadmapCreated, setRoadmapCreated] = useState(false);

  useEffect(() => {
    fetchJobRoles();
  }, []);

  const fetchJobRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await apiClient.get('/job-roles');

      setDomainData(response.data);
    } catch (err) {
      const apiError = normalizeApiError(err, 'Failed to load job roles');
      setError(apiError.userMessage);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDomain) {
      const domainObj = domainData.find(d => d.domain === selectedDomain);
      setAvailableRoles(domainObj ? domainObj.roles : []);
    } else {
      setAvailableRoles([]);
    }
  }, [selectedDomain, domainData]);

  const allRoles = domainData.flatMap((domain) =>
    (domain.roles || []).map((role) => ({
      ...role,
      domain: domain.domain
    }))
  );

  const searchOptions = searchQuery.trim().length === 0
    ? []
    : allRoles.filter((role) =>
      role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredDomainData = normalizedSearch.length === 0
    ? domainData
    : domainData.filter((domain) =>
      domain.domain.toLowerCase().includes(normalizedSearch) ||
      (domain.roles || []).some((role) =>
        role.title.toLowerCase().includes(normalizedSearch)
      )
    );

  const filteredAvailableRoles = normalizedSearch.length === 0
    ? availableRoles
    : availableRoles.filter((role) =>
      role.title.toLowerCase().includes(normalizedSearch)
    );

  const performAnalysis = async () => {
    if (!selectedJobRole && !customRoleName) {
      setError('Please select a job role or enter a custom one');
      return;
    }

    setLoading(true);
    setError('');
    setRoadmapCreated(false);

    try {
      const response = await apiClient.post(
        '/analysis/gap',
        {
          jobRoleId: isCustomRole ? null : selectedJobRole,
          customRole: isCustomRole ? customRoleName : null
        }
      );

      setAnalysisResult(response.data.analysis);
    } catch (err) {
      const apiError = normalizeApiError(err, 'Analysis failed');
      setError(apiError.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const createRoadmap = async () => {
    try {
      setRoadmapLoading(true);

      await apiClient.post(
        '/analysis/roadmap',
        {
          missingSkills: analysisResult.missingSkills,
          durationWeeks: 4
        }
      );

      setRoadmapCreated(true);
      showSuccess('Learning roadmap created.');

      if (setActiveTab) {
        setActiveTab("roadmap");
      }

    } catch (err) {
      const apiError = normalizeApiError(err, 'Failed to create roadmap');
      showError(apiError.userMessage);
    } finally {
      setRoadmapLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2.5 }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          Skill Gap Analysis
        </Typography>

        <Box sx={{ mb: 3 }}>
          {rolesLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Autocomplete
            options={searchOptions}
            getOptionLabel={(option) => `${option.title} (${option.domain})`}
            inputValue={searchQuery}
            onInputChange={(event, value) => setSearchQuery(value)}
            onChange={(event, selectedOption) => {
              if (!selectedOption) return;
              setSelectedDomain(selectedOption.domain);
              setSelectedJobRole(selectedOption.id);
              setIsCustomRole(false);
              setCustomRoleName('');
              setAnalysisResult(null);
              setError('');
            }}
            noOptionsText="No matching jobs/domains"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Job Role or Domain"
                placeholder="e.g. Data Scientist, Cybersecurity, Finance"
                fullWidth
              />
            )}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Domain</InputLabel>
              <Select
                label="Select Domain"
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setSelectedJobRole('');
                  setIsCustomRole(false);
                  setAnalysisResult(null); // Clear previous results
                }}
              >
                {filteredDomainData.map((d) => (
                  <MenuItem key={d.domain} value={d.domain}>
                    {d.domain}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedDomain}>
              <InputLabel>Select Job Role</InputLabel>
              <Select
                label="Select Job Role"
                value={isCustomRole ? 'other' : selectedJobRole}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'other') {
                    setIsCustomRole(true);
                    setSelectedJobRole('');
                    setCustomRoleName('');
                  } else {
                    setIsCustomRole(false);
                    setSelectedJobRole(val);
                  }
                  setAnalysisResult(null); // Clear previous results
                }}
              >
                {filteredAvailableRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.title}
                  </MenuItem>
                ))}
                <MenuItem value="other">+ Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {isCustomRole && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Custom Role"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={performAnalysis}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Gap'}
            </Button>
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* --- RESULTS SECTION --- */}
        {analysisResult && (
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>

            {/* Match Percentage */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={analysisResult.matchPercentage}
                  sx={{ height: 8, borderRadius: 999, bgcolor: 'divider' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
                {analysisResult.matchPercentage}%
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Matched Skills */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: 'transparent', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6">
                        Matched Skills ({analysisResult.matchedSkills?.length || 0})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysisResult.matchedSkills?.length > 0 ? (
                        analysisResult.matchedSkills.map(skill => (
                          <Chip key={skill} label={skill} variant="outlined" size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No skills matched yet.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Missing Skills */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: 'transparent', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CancelIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="h6">
                        Missing Skills ({analysisResult.missingSkills?.length || 0})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysisResult.missingSkills?.length > 0 ? (
                        analysisResult.missingSkills.map(skill => (
                          <Chip key={skill} label={skill} variant="outlined" size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Great job! No missing skills.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            {analysisResult.missingSkills?.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={createRoadmap}
                  disabled={roadmapCreated || roadmapLoading}
                  sx={{ px: 3, py: 1.2 }}
                >
                  {roadmapLoading ? 'Creating...' : roadmapCreated ? 'Roadmap Created!' : 'Create Learning Roadmap'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
