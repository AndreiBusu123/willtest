// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'therapist' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  voiceEnabled: boolean;
}

// Authentication types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

// Conversation types
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  sentiment?: SentimentData;
  audioUrl?: string;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  summary?: string;
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  typingIndicator: boolean;
}

// Sentiment types
export interface SentimentData {
  score: number; // -1 to 1
  magnitude: number; // 0 to infinity
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  dominantEmotion: string;
  timestamp: string;
}

export interface SentimentState {
  currentSentiment: SentimentData | null;
  history: SentimentData[];
  trends: {
    daily: SentimentData[];
    weekly: SentimentData[];
    monthly: SentimentData[];
  };
  isAnalyzing: boolean;
  error: string | null;
}

// Voice types
export interface VoiceState {
  isRecording: boolean;
  isPlaying: boolean;
  audioBlob: Blob | null;
  transcription: string | null;
  isTranscribing: boolean;
  error: string | null;
}

// WebSocket types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'sentiment' | 'presence' | 'error';
  payload: any;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard types
export interface DashboardStats {
  totalConversations: number;
  averageSentiment: number;
  totalMessages: number;
  activeTime: number; // in minutes
  improvementRate: number; // percentage
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}