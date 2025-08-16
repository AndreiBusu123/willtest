import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';
import sentimentReducer from './slices/sentimentSlice';
import voiceReducer from './slices/voiceSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversation: conversationReducer,
    sentiment: sentimentReducer,
    voice: voiceReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['voice/setAudioBlob'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.audioBlob'],
        // Ignore these paths in the state
        ignoredPaths: ['voice.audioBlob'],
      },
    }).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;