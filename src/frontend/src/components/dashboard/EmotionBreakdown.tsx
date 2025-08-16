import React from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { SentimentData } from '../../types';

interface EmotionBreakdownProps {
  sentimentHistory: SentimentData[];
}

const EmotionBreakdown: React.FC<EmotionBreakdownProps> = ({ sentimentHistory }) => {
  const theme = useTheme();

  const calculateAverageEmotions = () => {
    if (sentimentHistory.length === 0) {
      return {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
      };
    }

    const totals = sentimentHistory.reduce(
      (acc, curr) => ({
        joy: acc.joy + curr.emotions.joy,
        sadness: acc.sadness + curr.emotions.sadness,
        anger: acc.anger + curr.emotions.anger,
        fear: acc.fear + curr.emotions.fear,
        surprise: acc.surprise + curr.emotions.surprise,
        disgust: acc.disgust + curr.emotions.disgust,
      }),
      { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 }
    );

    const count = sentimentHistory.length;
    return {
      joy: totals.joy / count,
      sadness: totals.sadness / count,
      anger: totals.anger / count,
      fear: totals.fear / count,
      surprise: totals.surprise / count,
      disgust: totals.disgust / count,
    };
  };

  const emotions = calculateAverageEmotions();
  
  const emotionConfig = [
    { name: 'Joy', value: emotions.joy, color: theme.palette.success.main },
    { name: 'Sadness', value: emotions.sadness, color: theme.palette.info.main },
    { name: 'Anger', value: emotions.anger, color: theme.palette.error.main },
    { name: 'Fear', value: emotions.fear, color: theme.palette.warning.main },
    { name: 'Surprise', value: emotions.surprise, color: theme.palette.secondary.main },
    { name: 'Disgust', value: emotions.disgust, color: theme.palette.grey[600] },
  ];

  return (
    <Box>
      {emotionConfig.map((emotion) => (
        <Box key={emotion.name} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {emotion.name}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {(emotion.value * 100).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={emotion.value * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor: emotion.color,
                borderRadius: 4,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default EmotionBreakdown;