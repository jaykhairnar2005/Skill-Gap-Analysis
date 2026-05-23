import React from 'react';
import { Box } from '@mui/material';

const AnimatedBackground = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                pointerEvents: 'none',
                backgroundColor: 'background.default',
            }}
        />
    );
};

export default AnimatedBackground;
