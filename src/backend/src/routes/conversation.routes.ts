import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { conversationRateLimiter } from '../middleware/rateLimiter';
import { ConversationService } from '../services/conversation.service';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all conversation routes
router.use(authenticateToken);

// Start a new conversation
router.post(
  '/start',
  [
    body('title').optional().trim().isLength({ max: 255 }),
    body('initialMood').optional().isIn(['happy', 'sad', 'anxious', 'angry', 'neutral', 'confused']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const conversation = await ConversationService.startConversation({
        userId: req.user!.id,
        title: req.body.title,
        initialMood: req.body.initialMood,
      });

      res.status(201).json({
        message: 'Conversation started',
        conversation,
      });
    } catch (error) {
      logger.error('Start conversation error:', error);
      res.status(500).json({ error: 'Failed to start conversation' });
    }
  }
);

// Send a message in a conversation
router.post(
  '/:conversationId/messages',
  conversationRateLimiter,
  [
    param('conversationId').isUUID(),
    body('content').notEmpty().trim().isLength({ max: 5000 }),
    body('contentType').optional().isIn(['text', 'audio']),
    body('audioUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Add user message
      const userMessage = await ConversationService.addMessage({
        conversationId: req.params.conversationId,
        userId: req.user!.id,
        content: req.body.content,
        contentType: req.body.contentType,
        audioUrl: req.body.audioUrl,
      });

      // Generate AI response
      const aiResponse = await ConversationService.generateResponse(
        req.params.conversationId,
        req.user!.id
      );

      res.json({
        userMessage,
        aiResponse,
      });
    } catch (error: any) {
      logger.error('Send message error:', error);
      
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// Get conversation history
router.get(
  '/history',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;

      const conversations = await ConversationService.getConversationHistory(
        req.user!.id,
        limit,
        offset
      );

      res.json({
        conversations,
        pagination: {
          limit,
          offset,
          total: conversations.length,
        },
      });
    } catch (error) {
      logger.error('Get conversation history error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
  }
);

// Get specific conversation details
router.get(
  '/:conversationId',
  [param('conversationId').isUUID()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const details = await ConversationService.getConversationDetails(
        req.params.conversationId,
        req.user!.id
      );

      res.json(details);
    } catch (error: any) {
      logger.error('Get conversation details error:', error);
      
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to retrieve conversation details' });
    }
  }
);

// End a conversation
router.post(
  '/:conversationId/end',
  [
    param('conversationId').isUUID(),
    body('endMood').optional().isIn(['happy', 'sad', 'anxious', 'angry', 'neutral', 'confused']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await ConversationService.endConversation(
        req.params.conversationId,
        req.body.endMood
      );

      res.json({
        message: 'Conversation ended successfully',
      });
    } catch (error) {
      logger.error('End conversation error:', error);
      res.status(500).json({ error: 'Failed to end conversation' });
    }
  }
);

export default router;