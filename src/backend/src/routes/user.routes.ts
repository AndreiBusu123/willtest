import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { DatabaseService } from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const result = await DatabaseService.query(
      `SELECT id, email, username, first_name, last_name, avatar_url, 
              role, is_verified, preferences, created_at, last_login
       FROM users 
       WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
    body('avatarUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, avatarUrl } = req.body;

      const result = await DatabaseService.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, username, first_name, last_name, avatar_url, role, preferences`,
        [firstName, lastName, avatarUrl, req.user!.id]
      );

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Update user preferences
router.put(
  '/preferences',
  [body('preferences').isObject()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await DatabaseService.query(
        `UPDATE users 
         SET preferences = preferences || $1::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING preferences`,
        [JSON.stringify(req.body.preferences), req.user!.id]
      );

      res.json({
        message: 'Preferences updated successfully',
        preferences: result.rows[0].preferences,
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
);

// Get user statistics
router.get('/statistics', async (req: AuthRequest, res: Response) => {
  try {
    // Get conversation statistics
    const conversationStats = await DatabaseService.query(
      `SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_conversations,
        COUNT(CASE WHEN is_crisis = true THEN 1 END) as crisis_conversations,
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration_minutes
       FROM conversations
       WHERE user_id = $1`,
      [req.user!.id]
    );

    // Get message statistics
    const messageStats = await DatabaseService.query(
      `SELECT 
        COUNT(*) as total_messages,
        AVG(LENGTH(content)) as avg_message_length
       FROM messages
       WHERE user_id = $1`,
      [req.user!.id]
    );

    // Get sentiment statistics
    const sentimentStats = await DatabaseService.query(
      `SELECT 
        AVG(sentiment_score) as avg_sentiment,
        MIN(sentiment_score) as min_sentiment,
        MAX(sentiment_score) as max_sentiment,
        COUNT(CASE WHEN risk_level = 'high' OR risk_level = 'critical' THEN 1 END) as high_risk_count
       FROM sentiment_analysis
       WHERE user_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user!.id]
    );

    // Get recent activity
    const recentActivity = await DatabaseService.query(
      `SELECT DATE(created_at) as date, COUNT(*) as message_count
       FROM messages
       WHERE user_id = $1
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [req.user!.id]
    );

    res.json({
      conversations: conversationStats.rows[0],
      messages: messageStats.rows[0],
      sentiment: sentimentStats.rows[0],
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// Delete user account
router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }

    // Verify password
    const userResult = await DatabaseService.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(confirmPassword, userResult.rows[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (cascades to all related data)
    await DatabaseService.query('DELETE FROM users WHERE id = $1', [req.user!.id]);

    logger.info('User account deleted', { userId: req.user!.id });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;