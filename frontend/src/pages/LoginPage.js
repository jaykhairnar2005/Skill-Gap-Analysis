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
    Link as MuiLink
} from '@mui/material';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

export default function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const { showSuccess } = useFeedback();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            onLogin(response.data.token, response.data.user);
            showSuccess('Signed in successfully.');
            navigate('/dashboard');
        } catch (err) {
            const apiError = normalizeApiError(err, 'Login failed. Please try again.');
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
                py: 6
            }}
        >
            <Container maxWidth="sm">
                <Card sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <School sx={{ fontSize: 28, color: 'primary.main', mb: 1.5 }} />
                        <Typography variant="h4" sx={{ mb: 1 }}>
                            SkillGap
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to your workspace
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleLogin}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
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

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ py: 1.25 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                    </Box>

                    <Typography sx={{ textAlign: 'center', mt: 3, color: 'text.secondary', fontSize: '0.9rem' }}>
                        Don't have an account?{' '}
                        <MuiLink
                            component={RouterLink}
                            to="/register"
                            underline="none"
                            sx={{ color: 'primary.main', fontWeight: 600 }}
                        >
                            Sign up here
                        </MuiLink>
                    </Typography>
                </Card>
            </Container>
        </Box>
    );
}
