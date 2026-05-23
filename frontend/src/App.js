import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import ProtectedRoute from './components/ProtectedRoute';
import { FeedbackProvider } from './context/FeedbackContext';
import { clearAuth, getStoredUser, getToken, persistAuth } from './services/authStorage';
import { setUnauthorizedHandler } from './services/apiClient';

const THEME_STORAGE_KEY = 'ui_theme_mode';

const buildTheme = (mode) => {
    const isDark = mode === 'dark';
    const colors = isDark
        ? {
            bgDefault: '#0B0B0C',
            bgPaper: '#111113',
            divider: '#1F1F23',
            textPrimary: '#FFFFFF',
            textSecondary: '#A1A1AA',
            textMuted: '#6B7280',
            accent: '#FFFFFF',
            accentHover: '#E5E7EB',
            accentText: '#0B0B0C',
            inputHoverBorder: '#2A2A2F',
        }
        : {
            bgDefault: '#FFFFFF',
            bgPaper: '#F7F7F8',
            divider: '#E5E7EB',
            textPrimary: '#111113',
            textSecondary: '#4B5563',
            textMuted: '#6B7280',
            accent: '#111113',
            accentHover: '#000000',
            accentText: '#FFFFFF',
            inputHoverBorder: '#D1D5DB',
        };

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.accent,
                dark: colors.accentHover,
                contrastText: colors.accentText,
            },
            background: {
                default: colors.bgDefault,
                paper: colors.bgPaper,
            },
            text: {
                primary: colors.textPrimary,
                secondary: colors.textSecondary,
            },
            divider: colors.divider,
            success: {
                main: colors.accent,
            },
            warning: {
                main: colors.textSecondary,
            },
            error: {
                main: colors.textSecondary,
            },
        },
        typography: {
            fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
            h3: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
            h4: { fontWeight: 700, fontSize: '1.5rem' },
            h5: { fontWeight: 600, fontSize: '1.125rem' },
            subtitle1: { fontSize: '1rem' },
            body2: { fontSize: '0.9rem' },
        },
        shape: {
            borderRadius: 10,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: colors.bgDefault,
                        minHeight: '100vh',
                    },
                },
            },
            MuiContainer: {
                styleOverrides: {
                    root: {
                        paddingTop: 24,
                        paddingBottom: 24,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        padding: '10px 16px',
                        borderRadius: 8,
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        '&:focus-visible': {
                            outline: `2px solid ${colors.textPrimary}`,
                            outlineOffset: 2,
                        },
                    },
                    contained: {
                        backgroundColor: colors.accent,
                        color: colors.accentText,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: colors.accentHover,
                            boxShadow: 'none',
                        },
                    },
                    outlined: {
                        borderColor: colors.textPrimary,
                        color: colors.textPrimary,
                        '&:hover': {
                            borderColor: colors.textPrimary,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,19,0.04)',
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        '&:focus-visible': {
                            outline: `2px solid ${colors.textPrimary}`,
                            outlineOffset: 2,
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.bgPaper,
                        border: `1px solid ${colors.divider}`,
                        boxShadow: 'none',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiInputLabel-root': {
                            color: colors.textSecondary,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: colors.textPrimary,
                        },
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: colors.bgPaper,
                            borderRadius: 8,
                            '&:hover': {
                                backgroundColor: colors.bgPaper,
                            },
                            '&.Mui-focused': {
                                backgroundColor: colors.bgPaper,
                            },
                            '& fieldset': {
                                borderColor: colors.divider,
                            },
                            '&:hover fieldset': {
                                borderColor: colors.inputHoverBorder,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: colors.textPrimary,
                            },
                        },
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.bgPaper,
                        borderRadius: 8,
                        '& fieldset': {
                            borderColor: colors.divider,
                        },
                        '&:hover fieldset': {
                            borderColor: colors.inputHoverBorder,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colors.textPrimary,
                        },
                    },
                },
            },
            MuiFormLabel: {
                styleOverrides: {
                    root: {
                        color: colors.textSecondary,
                        '&.Mui-focused': {
                            color: colors.textPrimary,
                        },
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        minHeight: 44,
                        color: colors.textSecondary,
                        '&.Mui-selected': {
                            color: colors.textPrimary,
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        backgroundColor: colors.textPrimary,
                        height: 2,
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.divider,
                    },
                    bar: {
                        backgroundColor: colors.textPrimary,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderColor: colors.divider,
                    },
                    outlined: {
                        borderColor: colors.divider,
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${colors.divider}`,
                        backgroundColor: colors.bgPaper,
                        color: colors.textPrimary,
                    },
                    standardError: {
                        backgroundColor: colors.bgPaper,
                        color: colors.textPrimary,
                    },
                    standardWarning: {
                        backgroundColor: colors.bgPaper,
                        color: colors.textPrimary,
                    },
                    standardSuccess: {
                        backgroundColor: colors.bgPaper,
                        color: colors.textPrimary,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.bgDefault,
                        borderBottom: `1px solid ${colors.divider}`,
                        boxShadow: 'none',
                    },
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundColor: colors.bgPaper,
                        border: `1px solid ${colors.divider}`,
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.divider,
                        color: colors.textPrimary,
                    },
                },
            },
            MuiTypography: {
                styleOverrides: {
                    caption: {
                        color: colors.textMuted,
                    },
                },
            },
        },
    });
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');

    const theme = useMemo(() => buildTheme(themeMode), [themeMode]);

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }, [themeMode]);

    useEffect(() => {
        const token = getToken();
        const userData = getStoredUser();
        if (token && userData) {
            setIsAuthenticated(true);
            setUser(userData);
        }
        setAuthLoading(false);

        setUnauthorizedHandler(() => {
            clearAuth();
            setIsAuthenticated(false);
            setUser(null);
        });

        return () => {
            setUnauthorizedHandler(null);
        };
    }, []);

    const handleLogin = (token, userData) => {
        persistAuth(token, userData);
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = () => {
        clearAuth();
        setIsAuthenticated(false);
        setUser(null);
    };

    const handleToggleTheme = () => {
        setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    if (authLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'text.secondary' }}>Loading workspace...</Box>;
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <FeedbackProvider>
                <AnimatedBackground />
                <Router>
                    {isAuthenticated && (
                        <Navbar
                            onLogout={handleLogout}
                            user={user}
                            themeMode={themeMode}
                            onToggleTheme={handleToggleTheme}
                        />
                    )}
                    <Box sx={{ minHeight: '100vh' }}>
                        <Routes>
                            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} />
                            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage onLogin={handleLogin} />} />
                            <Route
                                path="/dashboard"
                                element={(
                                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                                        <Dashboard user={user} />
                                    </ProtectedRoute>
                                )}
                            />
                            <Route
                                path="/profile"
                                element={(
                                    <ProtectedRoute isAuthenticated={isAuthenticated} authLoading={authLoading}>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                )}
                            />
                            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
                        </Routes>
                    </Box>
                </Router>
            </FeedbackProvider>
        </ThemeProvider>
    );
}

export default App;
