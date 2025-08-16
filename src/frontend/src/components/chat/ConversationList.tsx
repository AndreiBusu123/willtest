import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Fab,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Add,
  Search,
  Chat,
  MoreVert,
  Delete,
  Edit,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { AppDispatch, RootState } from '../../store';
import { 
  createConversation, 
  deleteConversation,
  setCurrentConversation 
} from '../../store/slices/conversationSlice';

const ConversationList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, currentConversation } = useSelector(
    (state: RootState) => state.conversation
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const handleCreateConversation = async () => {
    const title = `Conversation ${conversations.length + 1}`;
    const result = await dispatch(createConversation(title));
    if (createConversation.fulfilled.match(result)) {
      navigate(`/chat/${result.payload.id}`);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    dispatch(setCurrentConversation(conversation));
    navigate(`/chat/${conversation.id}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, convId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedConvId(convId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConvId(null);
  };

  const handleDeleteConversation = async () => {
    if (selectedConvId) {
      await dispatch(deleteConversation(selectedConvId));
      handleMenuClose();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some((msg) => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Conversations
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Divider />
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {filteredConversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuOpen(e, conversation.id)}
                >
                  <MoreVert />
                </IconButton>
              }
              sx={{
                backgroundColor:
                  currentConversation?.id === conversation.id
                    ? theme.palette.action.selected
                    : 'transparent',
              }}
            >
              <ListItemButton onClick={() => handleSelectConversation(conversation)}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                    <Chat />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={conversation.title}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        noWrap
                      >
                        {conversation.messages.length > 0
                          ? conversation.messages[conversation.messages.length - 1].content
                          : 'No messages yet'}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {format(new Date(conversation.updatedAt), 'MMM dd, HH:mm')}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateConversation}
          sx={{ width: '100%', borderRadius: 2 }}
          variant="extended"
        >
          <Add sx={{ mr: 1 }} />
          New Conversation
        </Fab>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteConversation}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ConversationList;