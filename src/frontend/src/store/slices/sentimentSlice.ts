import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SentimentData, SentimentState } from '../../types';
import sentimentService from '../../services/sentimentService';

const initialState: SentimentState = {
  currentSentiment: null,
  history: [],
  trends: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  isAnalyzing: false,
  error: null,
};

export const analyzeSentiment = createAsyncThunk(
  'sentiment/analyze',
  async (text: string) => {
    const response = await sentimentService.analyzeSentiment(text);
    return response;
  }
);

export const fetchSentimentHistory = createAsyncThunk(
  'sentiment/fetchHistory',
  async (conversationId: string) => {
    const response = await sentimentService.getSentimentHistory(conversationId);
    return response;
  }
);

export const fetchSentimentTrends = createAsyncThunk(
  'sentiment/fetchTrends',
  async (period: 'daily' | 'weekly' | 'monthly') => {
    const response = await sentimentService.getSentimentTrends(period);
    return { period, data: response };
  }
);

const sentimentSlice = createSlice({
  name: 'sentiment',
  initialState,
  reducers: {
    updateCurrentSentiment: (state, action: PayloadAction<SentimentData>) => {
      state.currentSentiment = action.payload;
      state.history.push(action.payload);
    },
    clearSentiment: (state) => {
      state.currentSentiment = null;
      state.history = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Analyze sentiment
    builder
      .addCase(analyzeSentiment.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeSentiment.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.currentSentiment = action.payload;
        state.history.push(action.payload);
      })
      .addCase(analyzeSentiment.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.error.message || 'Failed to analyze sentiment';
      });

    // Fetch history
    builder
      .addCase(fetchSentimentHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });

    // Fetch trends
    builder
      .addCase(fetchSentimentTrends.fulfilled, (state, action) => {
        const { period, data } = action.payload;
        state.trends[period] = data;
      });
  },
});

export const { updateCurrentSentiment, clearSentiment, clearError } = sentimentSlice.actions;
export default sentimentSlice.reducer;