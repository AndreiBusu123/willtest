import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import { Chat, Schedule } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Conversation } from '../../types';

interface RecentConversationsProps {
  conversations: Conversation[];
}

const RecentConversations: React.FC<RecentConversationsProps> = ({ conversations }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  if (conversations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No conversations yet. Start a new conversation to begin.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {conversations.map((conversation) => (
        <ListItem
          key={conversation.id}
          button
          onClick={() => handleConversationClick(conversation.id)}
          sx={{
            borderRadius: 2,
            mb: 1,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
              <Chat />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" noWrap sx={{ maxWidth: '60%' }}>
                  {conversation.title}
                </Typography>
                <Chip
                  icon={<Schedule />}
                  label={formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                  size="small"
                  variant="outlined"
                />
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {conversation.messages.length > 0
                    ? conversation.messages[conversation.messages.length - 1].content
                    : 'No messages yet'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {conversation.messages.length} messages • {format(new Date(conversation.createdAt), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default RecentConversations;