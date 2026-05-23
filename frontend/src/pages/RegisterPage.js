import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Card,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Grid,
    Link as MuiLink
} from '@mui/material';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

export default function RegisterPage({ onLogin }) {
    const navigate = useNavigate();
    const { showSuccess } = useFeedback();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/auth/register', {
                firstName,
                lastName,
                email,
                password,
            });

            onLogin(response.data.token, response.data.user);
            showSuccess('Account created successfully.');
            navigate('/dashboard');
        } catch (err) {
            const apiError = normalizeApiError(err, 'Registration failed. Please try again.');
            setError(apiError.userMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: 6,
            }}
        >
            <Container maxWidth="sm">
                <Card sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <School sx={{ fontSize: 28, color: 'primary.main', mb: 1.5 }} />
                        <Typography
                            variant="h4"
                            sx={{ mb: 1 }}
                        >
                            SkillGap
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your account
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleRegister}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    fullWidth
                                    required
                                    size="small"
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    fullWidth
                                    size="small"
                                    disabled={loading}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                            size="small"
                            disabled={loading}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                            size="small"
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            fullWidth
                            required
                            size="small"
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            edge="end"
                                            size="small"
                                            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        >
                                            {showConfirmPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ py: 1.25 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Account'}
                        </Button>
                    </Box>

                    <Typography
                        sx={{ textAlign: 'center', mt: 3, color: 'text.secondary', fontSize: '0.9rem' }}
                    >
                        Already have an account?{' '}
                        <MuiLink
                            component={RouterLink}
                            to="/login"
                            underline="none"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 600,
                            }}
                        >
                            Login here
                        </MuiLink>
                    </Typography>
                </Card>
            </Container>
        </Box>
    );
}
