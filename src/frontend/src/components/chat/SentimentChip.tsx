import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { SentimentData } from '../../types';

interface SentimentChipProps {
  sentiment: SentimentData;
  size?: 'small' | 'medium';
}

const SentimentChip: React.FC<SentimentChipProps> = ({ sentiment, size = 'small' }) => {
  const theme = useTheme();

  const getChipColor = () => {
    const score = sentiment.score;
    if (score >= 0.2) return 'success';
    if (score >= -0.2) return 'default';
    return 'error';
  };

  const getChipLabel = () => {
    return sentiment.dominantEmotion.charAt(0).toUpperCase() + sentiment.dominantEmotion.slice(1);
  };

  return (
    <Chip
      label={getChipLabel()}
      size={size}
      color={getChipColor()}
      variant="outlined"
      sx={{
        height: size === 'small' ? 20 : 24,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
      }}
    />
  );
};

export default SentimentChip;