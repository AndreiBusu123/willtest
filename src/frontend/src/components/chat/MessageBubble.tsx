import React from 'react';
import { Box, Paper, Typography, Avatar, Chip, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { Message } from '../../types';
import SentimentChip from './SentimentChip';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-end',
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 32,
            height: 32,
            mr: 1,
          }}
        >
          AI
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser
              ? theme.palette.primary.main
              : theme.palette.background.paper,
            color: isUser
              ? theme.palette.primary.contrastText
              : theme.palette.text.primary,
            borderRadius: 2,
            borderTopRightRadius: isUser ? 0 : 16,
            borderTopLeftRadius: isUser ? 16 : 0,
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Paper>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5,
            px: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {format(new Date(message.timestamp), 'HH:mm')}
          </Typography>
          {message.sentiment && (
            <SentimentChip sentiment={message.sentiment} size="small" />
          )}
        </Box>
      </Box>
      {isUser && (
        <Avatar
          sx={{
            bgcolor: theme.palette.secondary.main,
            width: 32,
            height: 32,
            ml: 1,
          }}
        >
          {currentUserId.charAt(0).toUpperCase()}
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;