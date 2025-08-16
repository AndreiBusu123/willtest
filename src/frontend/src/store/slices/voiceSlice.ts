import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VoiceState } from '../../types';
import voiceService from '../../services/voiceService';

const initialState: VoiceState = {
  isRecording: false,
  isPlaying: false,
  audioBlob: null,
  transcription: null,
  isTranscribing: false,
  error: null,
};

export const transcribeAudio = createAsyncThunk(
  'voice/transcribe',
  async (audioBlob: Blob) => {
    const response = await voiceService.transcribeAudio(audioBlob);
    return response;
  }
);

export const synthesizeSpeech = createAsyncThunk(
  'voice/synthesize',
  async (text: string) => {
    const response = await voiceService.synthesizeSpeech(text);
    return response;
  }
);

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.error = null;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    setAudioBlob: (state, action: PayloadAction<Blob | null>) => {
      state.audioBlob = action.payload;
    },
    startPlaying: (state) => {
      state.isPlaying = true;
    },
    stopPlaying: (state) => {
      state.isPlaying = false;
    },
    clearTranscription: (state) => {
      state.transcription = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Transcribe audio
    builder
      .addCase(transcribeAudio.pending, (state) => {
        state.isTranscribing = true;
        state.error = null;
      })
      .addCase(transcribeAudio.fulfilled, (state, action) => {
        state.isTranscribing = false;
        state.transcription = action.payload.text;
      })
      .addCase(transcribeAudio.rejected, (state, action) => {
        state.isTranscribing = false;
        state.error = action.error.message || 'Failed to transcribe audio';
      });

    // Synthesize speech
    builder
      .addCase(synthesizeSpeech.fulfilled, (state, action) => {
        state.audioBlob = action.payload;
      })
      .addCase(synthesizeSpeech.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to synthesize speech';
      });
  },
});

export const {
  startRecording,
  stopRecording,
  setAudioBlob,
  startPlaying,
  stopPlaying,
  clearTranscription,
  clearError,
} = voiceSlice.actions;

export default voiceSlice.reducer;