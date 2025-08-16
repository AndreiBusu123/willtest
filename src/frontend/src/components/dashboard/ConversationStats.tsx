import React from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';
import { Conversation } from '../../types';

interface ConversationStatsProps {
  conversations: Conversation[];
}

const ConversationStats: React.FC<ConversationStatsProps> = ({ conversations }) => {
  const theme = useTheme();

  const calculateStats = () => {
    const totalMessages = conversations.reduce((acc, conv) => acc + conv.messages.length, 0);
    const avgMessagesPerConv = conversations.length > 0 ? totalMessages / conversations.length : 0;
    
    const activeDays = new Set(
      conversations.map((conv) => format(new Date(conv.createdAt), 'yyyy-MM-dd'))
    ).size;

    const longestConversation = conversations.reduce(
      (longest, conv) => (conv.messages.length > longest.messages.length ? conv : longest),
      conversations[0] || { messages: [] }
    );

    const mostRecentConversation = conversations.reduce(
      (recent, conv) => 
        new Date(conv.updatedAt) > new Date(recent.updatedAt) ? conv : recent,
      conversations[0] || { updatedAt: new Date().toISOString() }
    );

    return {
      totalConversations: conversations.length,
      totalMessages,
      avgMessagesPerConv: avgMessagesPerConv.toFixed(1),
      activeDays,
      longestConversation: longestConversation?.title || 'N/A',
      longestConversationMessages: longestConversation?.messages.length || 0,
      mostRecentConversation: mostRecentConversation?.title || 'N/A',
    };
  };

  const stats = calculateStats();

  const StatRow = ({ label, value }: { label: string; value: string | number }) => (
    <Box sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <StatRow label="Total Conversations" value={stats.totalConversations} />
      <Divider />
      <StatRow label="Total Messages" value={stats.totalMessages} />
      <Divider />
      <StatRow label="Avg Messages per Conversation" value={stats.avgMessagesPerConv} />
      <Divider />
      <StatRow label="Active Days" value={stats.activeDays} />
      <Divider />
      <StatRow 
        label="Longest Conversation" 
        value={`${stats.longestConversation} (${stats.longestConversationMessages} msgs)`} 
      />
      <Divider />
      <StatRow label="Most Recent" value={stats.mostRecentConversation} />
    </Box>
  );
};

// Import format at the top of the file
import { format } from 'date-fns';

export default ConversationStats;