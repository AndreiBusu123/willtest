import React from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import {
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  SentimentVeryDissatisfied,
} from '@mui/icons-material';
import { SentimentData } from '../../types';

interface SentimentIndicatorProps {
  sentiment: SentimentData | null;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ sentiment }) => {
  const theme = useTheme();

  if (!sentiment) return null;

  const getSentimentIcon = () => {
    const score = sentiment.score;
    if (score >= 0.6) return <SentimentVerySatisfied color="success" />;
    if (score >= 0.2) return <SentimentSatisfied color="success" />;
    if (score >= -0.2) return <SentimentNeutral color="action" />;
    if (score >= -0.6) return <SentimentDissatisfied color="warning" />;
    return <SentimentVeryDissatisfied color="error" />;
  };

  const getSentimentLabel = () => {
    const score = sentiment.score;
    if (score >= 0.6) return 'Very Positive';
    if (score >= 0.2) return 'Positive';
    if (score >= -0.2) return 'Neutral';
    if (score >= -0.6) return 'Negative';
    return 'Very Negative';
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: theme.palette.success.main,
      sadness: theme.palette.info.main,
      anger: theme.palette.error.main,
      fear: theme.palette.warning.main,
      surprise: theme.palette.secondary.main,
      disgust: theme.palette.grey[600],
    };
    return colors[emotion] || theme.palette.grey[500];
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Sentiment Analysis
          </Typography>
          <Typography variant="body2" gutterBottom>
            Overall: {getSentimentLabel()} ({(sentiment.score * 100).toFixed(0)}%)
          </Typography>
          <Typography variant="body2" gutterBottom>
            Dominant: {sentiment.dominantEmotion}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {Object.entries(sentiment.emotions).map(([emotion, value]) => (
              <Box key={emotion} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getEmotionColor(emotion),
                    mr: 1,
                  }}
                />
                <Typography variant="caption">
                  {emotion}: {(value * 100).toFixed(0)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      }
      arrow
      placement="bottom"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        {getSentimentIcon()}
      </Box>
    </Tooltip>
  );
};

export default SentimentIndicator;