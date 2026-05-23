import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar
} from '@mui/material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

export default function ProfilePage() {
  const { showSuccess, showError } = useFeedback();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    experienceLevel: '',
    targetRole: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ GET PROFILE
  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/auth/profile');

      setProfile({
        firstName: response.data.first_name || '',
        lastName: response.data.last_name || '',
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        experienceLevel: response.data.experience_level || '',
        targetRole: response.data.target_role || '',
      });

      setMessage('');
    } catch (error) {
      const apiError = normalizeApiError(error, 'Failed to load profile');
      setMessage(apiError.userMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATE PROFILE
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.put('/auth/profile', profile);

      setMessage('Profile updated successfully!');
      showSuccess('Profile updated successfully.');
    } catch (error) {
      const apiError = normalizeApiError(error, 'Failed to update profile');
      setMessage(apiError.userMessage);
      showError(apiError.userMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      <Grid container spacing={4}>
        {/* Left Column: Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', py: 3, height: '100%' }}>
            <CardContent>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: 'divider',
                  color: 'text.primary',
                  fontSize: '2.25rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {profile.firstName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {profile.targetRole || 'Aspiring Professional'}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ bgcolor: 'background.paper', color: 'text.secondary', px: 2, py: 0.5, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                  {profile.experienceLevel ? profile.experienceLevel.toUpperCase() : 'NO LEVEL SET'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Edit Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                  Edit Profile
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleUpdate}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Target Job Role"
                      value={profile.targetRole}
                      onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                      fullWidth
                      placeholder="e.g. Software Engineer"
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={profile.experienceLevel}
                        label="Experience Level"
                        onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
                      >
                        <MenuItem value=""><em>Select Level</em></MenuItem>
                        <MenuItem value="beginner">Beginner (0-2 years)</MenuItem>
                        <MenuItem value="intermediate">Intermediate (3-5 years)</MenuItem>
                        <MenuItem value="advanced">Advanced (5+ years)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Professional Bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Tell us about your career goals..."
                      variant="outlined"
                    />
                  </Grid>
                </Grid>

                {message && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography sx={{ color: message.includes('success') ? 'primary.main' : 'text.secondary', textAlign: 'center' }}>
                      {message}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    sx={{ minWidth: 150 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
