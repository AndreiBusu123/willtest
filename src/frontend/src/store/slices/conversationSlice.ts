import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, ConversationState, Message } from '../../types';
import conversationService from '../../services/conversationService';

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
  typingIndicator: false,
};

export const fetchConversations = createAsyncThunk(
  'conversation/fetchAll',
  async () => {
    const response = await conversationService.getConversations();
    return response;
  }
);

export const fetchConversation = createAsyncThunk(
  'conversation/fetchOne',
  async (id: string) => {
    const response = await conversationService.getConversation(id);
    return response;
  }
);

export const createConversation = createAsyncThunk(
  'conversation/create',
  async (title: string) => {
    const response = await conversationService.createConversation(title);
    return response;
  }
);

export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async ({ conversationId, content }: { conversationId: string; content: string }) => {
    const response = await conversationService.sendMessage(conversationId, content);
    return response;
  }
);

export const deleteConversation = createAsyncThunk(
  'conversation/delete',
  async (id: string) => {
    await conversationService.deleteConversation(id);
    return id;
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentConversation && 
          state.currentConversation.id === action.payload.conversationId) {
        state.currentConversation.messages.push(action.payload);
      }
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<Message> }>) => {
      if (state.currentConversation) {
        const messageIndex = state.currentConversation.messages.findIndex(
          (msg) => msg.id === action.payload.id
        );
        if (messageIndex !== -1) {
          state.currentConversation.messages[messageIndex] = {
            ...state.currentConversation.messages[messageIndex],
            ...action.payload.updates,
          };
        }
      }
    },
    setTypingIndicator: (state, action: PayloadAction<boolean>) => {
      state.typingIndicator = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      });

    // Fetch single conversation
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch conversation';
      });

    // Create conversation
    builder
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.push(action.payload);
        state.currentConversation = action.payload;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.typingIndicator = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.typingIndicator = false;
        if (state.currentConversation) {
          state.currentConversation.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.typingIndicator = false;
        state.error = action.error.message || 'Failed to send message';
      });

    // Delete conversation
    builder
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          (conv) => conv.id !== action.payload
        );
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
        }
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateMessage,
  setTypingIndicator,
  clearError,
} = conversationSlice.actions;

export default conversationSlice.reducer;