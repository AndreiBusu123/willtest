import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Send,
  Mic,
  MicOff,
  EmojiEmotions,
  AttachFile,
  MoreVert,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { sendMessage, setTypingIndicator } from '../../store/slices/conversationSlice';
import { analyzeSentiment } from '../../store/slices/sentimentSlice';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import VoiceRecorder from '../voice/VoiceRecorder';
import SentimentIndicator from './SentimentIndicator';
import websocketService from '../../services/websocketService';

const ChatInterface: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const { currentConversation, typingIndicator, isLoading } = useSelector(
    (state: RootState) => state.conversation
  );
  const { currentSentiment } = useSelector((state: RootState) => state.sentiment);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    if (currentConversation) {
      websocketService.joinConversation(currentConversation.id);
      return () => {
        websocketService.leaveConversation(currentConversation.id);
      };
    }
  }, [currentConversation?.id]);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    if (message.length > 0) {
      websocketService.sendTypingIndicator(currentConversation?.id || '', true);
      typingTimeout = setTimeout(() => {
        websocketService.sendTypingIndicator(currentConversation?.id || '', false);
      }, 1000);
    }
    return () => clearTimeout(typingTimeout);
  }, [message, currentConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentConversation) return;

    const messageContent = message.trim();
    setMessage('');
    
    // Send message
    await dispatch(sendMessage({
      conversationId: currentConversation.id,
      content: messageContent,
    }));

    // Analyze sentiment
    dispatch(analyzeSentiment(messageContent));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceMessage = (transcript: string) => {
    setMessage(transcript);
    setShowVoiceRecorder(false);
  };

  if (!currentConversation) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h5" color="text.secondary">
          Select or start a conversation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your therapeutic journey begins with a single message
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
            AI
          </Avatar>
          <Box>
            <Typography variant="h6">AI Therapist</Typography>
            <Typography variant="caption" color="text.secondary">
              {typingIndicator ? 'Typing...' : 'Active now'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SentimentIndicator sentiment={currentSentiment} />
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : theme.palette.grey[50],
        }}
      >
        {currentConversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={user?.id || ''} />
        ))}
        {typingIndicator && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onTranscription={handleVoiceMessage}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <IconButton>
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          <IconButton>
            <EmojiEmotions />
          </IconButton>
          <IconButton
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            color={isRecording ? 'error' : 'default'}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;