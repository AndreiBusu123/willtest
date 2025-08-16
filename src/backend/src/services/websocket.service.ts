import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DatabaseService } from './database.service';
import { ConversationService } from './conversation.service';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  conversationId?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initialize();
  }

  private initialize(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        
        // Verify user exists and is active
        const result = await DatabaseService.query(
          'SELECT id, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
          return next(new Error('Invalid user'));
        }

        socket.userId = decoded.userId;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', { userId: socket.userId, socketId: socket.id });
      
      // Track user sockets
      this.addUserSocket(socket.userId!, socket.id);

      // Join user room
      socket.join(`user:${socket.userId}`);

      // Handle joining conversation
      socket.on('join-conversation', async (conversationId: string) => {
        try {
          // Verify user owns the conversation
          const result = await DatabaseService.query(
            'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
            [conversationId, socket.userId]
          );

          if (result.rows.length === 0) {
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }

          socket.conversationId = conversationId;
          socket.join(`conversation:${conversationId}`);
          socket.emit('joined-conversation', { conversationId });
          
          logger.info('User joined conversation', { userId: socket.userId, conversationId });
        } catch (error) {
          logger.error('Join conversation error:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving conversation
      socket.on('leave-conversation', () => {
        if (socket.conversationId) {
          socket.leave(`conversation:${socket.conversationId}`);
          logger.info('User left conversation', { 
            userId: socket.userId, 
            conversationId: socket.conversationId 
          });
          socket.conversationId = undefined;
        }
      });

      // Handle sending message
      socket.on('send-message', async (data: {
        conversationId: string;
        content: string;
        contentType?: 'text' | 'audio';
        audioUrl?: string;
      }) => {
        try {
          if (!socket.conversationId || socket.conversationId !== data.conversationId) {
            socket.emit('error', { message: 'Not in conversation' });
            return;
          }

          // Add user message
          const userMessage = await ConversationService.addMessage({
            conversationId: data.conversationId,
            userId: socket.userId!,
            content: data.content,
            contentType: data.contentType,
            audioUrl: data.audioUrl,
          });

          // Broadcast to conversation room
          this.io.to(`conversation:${data.conversationId}`).emit('new-message', userMessage);

          // Generate AI response
          socket.emit('ai-typing', { isTyping: true });
          
          const aiResponse = await ConversationService.generateResponse(
            data.conversationId,
            socket.userId!
          );

          // Broadcast AI response
          this.io.to(`conversation:${data.conversationId}`).emit('new-message', aiResponse);
          socket.emit('ai-typing', { isTyping: false });

        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
          socket.emit('ai-typing', { isTyping: false });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
        if (socket.conversationId === data.conversationId) {
          socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
            userId: socket.userId,
            isTyping: data.isTyping,
          });
        }
      });

      // Handle voice stream start
      socket.on('start-voice-stream', (data: { conversationId: string }) => {
        if (socket.conversationId === data.conversationId) {
          socket.emit('voice-stream-ready');
          logger.info('Voice stream started', { userId: socket.userId, conversationId: data.conversationId });
        }
      });

      // Handle voice data chunks
      socket.on('voice-data', async (data: { chunk: ArrayBuffer }) => {
        // Process voice data (would integrate with speech-to-text service)
        logger.debug('Received voice data chunk', { size: data.chunk.byteLength });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { userId: socket.userId, socketId: socket.id });
        this.removeUserSocket(socket.userId!, socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error:', { userId: socket.userId, error });
      });
    });
  }

  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}