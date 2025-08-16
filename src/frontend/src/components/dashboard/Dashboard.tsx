import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Psychology,
  ChatBubble,
  AccessTime,
  EmojiEmotions,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { fetchSentimentTrends } from '../../store/slices/sentimentSlice';
import { fetchConversations } from '../../store/slices/conversationSlice';
import SentimentChart from './SentimentChart';
import ConversationStats from './ConversationStats';
import EmotionBreakdown from './EmotionBreakdown';
import RecentConversations from './RecentConversations';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { conversations } = useSelector((state: RootState) => state.conversation);
  const { trends } = useSelector((state: RootState) => state.sentiment);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchSentimentTrends('daily'));
    dispatch(fetchSentimentTrends('weekly'));
  }, [dispatch]);

  const stats = {
    totalConversations: conversations.length,
    totalMessages: conversations.reduce((acc, conv) => acc + conv.messages.length, 0),
    averageSentiment: trends.daily.length > 0
      ? trends.daily.reduce((acc, s) => acc + s.score, 0) / trends.daily.length
      : 0,
    activeTime: conversations.reduce((acc, conv) => {
      const start = new Date(conv.createdAt);
      const end = new Date(conv.updatedAt);
      return acc + (end.getTime() - start.getTime()) / 60000; // in minutes
    }, 0),
  };

  const StatCard = ({ icon, title, value, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Here's an overview of your therapeutic journey
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ChatBubble />}
            title="Total Conversations"
            value={stats.totalConversations}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Psychology />}
            title="Messages Exchanged"
            value={stats.totalMessages}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<EmojiEmotions />}
            title="Avg. Sentiment"
            value={`${(stats.averageSentiment * 100).toFixed(0)}%`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AccessTime />}
            title="Active Time"
            value={`${Math.round(stats.activeTime)} min`}
            color="info"
          />
        </Grid>

        {/* Sentiment Trends Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Trends
            </Typography>
            <SentimentChart data={trends.weekly} />
          </Paper>
        </Grid>

        {/* Emotion Breakdown */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Emotion Breakdown
            </Typography>
            <EmotionBreakdown sentimentHistory={trends.daily} />
          </Paper>
        </Grid>

        {/* Recent Conversations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Conversations
            </Typography>
            <RecentConversations conversations={conversations.slice(0, 5)} />
          </Paper>
        </Grid>

        {/* Conversation Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conversation Insights
            </Typography>
            <ConversationStats conversations={conversations} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;