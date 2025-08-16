import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Paper } from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { fetchConversations, fetchConversation, createConversation } from '../store/slices/conversationSlice';
import ChatInterface from '../components/chat/ChatInterface';
import ConversationList from '../components/chat/ConversationList';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, currentConversation } = useSelector((state: RootState) => state.conversation);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversation(conversationId));
    } else if (conversations.length === 0) {
      // Create a new conversation if none exist
      dispatch(createConversation('New Conversation'));
    } else if (!currentConversation) {
      // Select the first conversation if none is selected
      dispatch(fetchConversation(conversations[0].id));
    }
  }, [conversationId, conversations, currentConversation, dispatch]);

  return (
    <Box sx={{ height: 'calc(100vh - 112px)', display: 'flex' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <ConversationList />
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ChatInterface />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatPage;