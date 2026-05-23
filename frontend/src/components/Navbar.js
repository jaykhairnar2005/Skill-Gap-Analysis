import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Menu,
    MenuItem,
    Avatar,
    IconButton,
    Tooltip,
} from '@mui/material';
import { School, Logout, Settings, DarkMode, LightMode } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onLogout, user, themeMode = 'dark', onToggleTheme }) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        navigate('/profile');
        handleMenuClose();
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
        handleMenuClose();
    };

    const avatarLetter = user?.firstName?.[0]?.toUpperCase() || 'U';

    return (
        <AppBar position="sticky" sx={{
            backgroundColor: 'background.default',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    <School sx={{ fontSize: 22, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        SkillGap Analyzer
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {user?.firstName} {user?.lastName}
                    </Typography>

                    <Tooltip title={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                        <IconButton
                            onClick={onToggleTheme}
                            aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                color: 'text.primary',
                            }}
                        >
                            {themeMode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <IconButton onClick={handleMenuOpen} sx={{ p: 0 }} aria-label="Open profile menu">
                        <Avatar sx={{ bgcolor: 'divider', color: 'text.primary', width: 34, height: 34, fontSize: '0.9rem' }}>
                            {avatarLetter}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleProfile} sx={{ display: 'flex', gap: 1 }}>
                            <Settings fontSize="small" />
                            <Typography>Profile Settings</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ display: 'flex', gap: 1 }}>
                            <Logout fontSize="small" />
                            <Typography>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
