import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { SentimentData } from '../../types';

interface SentimentChartProps {
  data: SentimentData[];
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  const theme = useTheme();

  const chartData = data.map((item) => ({
    date: format(new Date(item.timestamp), 'MMM dd'),
    sentiment: (item.score * 100).toFixed(0),
    joy: (item.emotions.joy * 100).toFixed(0),
    sadness: (item.emotions.sadness * 100).toFixed(0),
    anger: (item.emotions.anger * 100).toFixed(0),
  }));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorJoy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            stroke={theme.palette.text.secondary}
            style={{ fontSize: 12 }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={{ fontSize: 12 }}
            domain={[-100, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={theme.palette.primary.main}
            fillOpacity={1}
            fill="url(#colorSentiment)"
            strokeWidth={2}
            name="Overall Sentiment"
          />
          <Line
            type="monotone"
            dataKey="joy"
            stroke={theme.palette.success.main}
            strokeWidth={2}
            dot={false}
            name="Joy"
          />
          <Line
            type="monotone"
            dataKey="sadness"
            stroke={theme.palette.info.main}
            strokeWidth={2}
            dot={false}
            name="Sadness"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SentimentChart;