import React from 'react';
import { Box, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingIndicator: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        width: 'fit-content',
        mb: 2,
      }}
    >
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: theme.palette.text.secondary,
            animation: `${bounce} 1.4s ease-in-out infinite`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </Box>
  );
};

export default TypingIndicator;