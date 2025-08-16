import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, setTypingIndicator } from '../store/slices/conversationSlice';
import { updateCurrentSentiment } from '../store/slices/sentimentSlice';
import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    
    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('message', (data: WebSocketMessage) => {
      switch (data.type) {
        case 'message':
          store.dispatch(addMessage(data.payload));
          break;
        case 'typing':
          store.dispatch(setTypingIndicator(data.payload.isTyping));
          break;
        case 'sentiment':
          store.dispatch(updateCurrentSentiment(data.payload));
          break;
        case 'error':
          console.error('WebSocket error:', data.payload);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  sendMessage(conversationId: string, content: string) {
    if (this.socket) {
      this.socket.emit('send_message', { conversationId, content });
    }
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();