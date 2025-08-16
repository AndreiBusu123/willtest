import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { DatabaseService } from '../services/database.service';
import { OpenAIService } from '../services/openai.service';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication
router.use(authenticateToken);

// Analyze sentiment of text
router.post(
  '/analyze',
  [body('text').notEmpty().trim().isLength({ max: 5000 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text } = req.body;

      // Perform sentiment analysis
      const sentimentData = await OpenAIService.analyzeSentiment(text);

      // Check for crisis indicators
      const crisisData = await OpenAIService.detectCrisisIndicators(text);

      // Store analysis in database
      await DatabaseService.query(
        `INSERT INTO sentiment_analysis (
          user_id, text_input, sentiment_score, magnitude, emotions,
          dominant_emotion, keywords, risk_level, crisis_indicators
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          req.user!.id,
          text,
          sentimentData.sentiment,
          Math.abs(sentimentData.sentiment),
          sentimentData.emotions,
          Object.entries(sentimentData.emotions).reduce((a, b) => (a[1] > b[1] ? a : b))[0],
          sentimentData.keywords,
          crisisData.riskLevel,
          crisisData.indicators,
        ]
      );

      res.json({
        sentiment: sentimentData,
        crisis: crisisData,
      });
    } catch (error) {
      logger.error('Sentiment analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  }
);

// Get sentiment trends for user
router.get(
  '/trends',
  [
    query('days').optional().isInt({ min: 1, max: 365 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const days = Number(req.query.days) || 30;
      const limit = Number(req.query.limit) || 100;

      const result = await DatabaseService.query(
        `SELECT 
          DATE(created_at) as date,
          AVG(sentiment_score) as avg_sentiment,
          AVG(magnitude) as avg_magnitude,
          jsonb_object_agg(
            dominant_emotion, 
            emotion_count
          ) as emotion_distribution
        FROM (
          SELECT 
            created_at,
            sentiment_score,
            magnitude,
            dominant_emotion,
            COUNT(*) OVER (PARTITION BY DATE(created_at), dominant_emotion) as emotion_count
          FROM sentiment_analysis
          WHERE user_id = $1
            AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        ) t
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT $2`,
        [req.user!.id, limit]
      );

      res.json({
        trends: result.rows,
        period: `${days} days`,
      });
    } catch (error) {
      logger.error('Get sentiment trends error:', error);
      res.status(500).json({ error: 'Failed to retrieve sentiment trends' });
    }
  }
);

// Get emotion statistics
router.get('/emotions/stats', async (req: AuthRequest, res: Response) => {
  try {
    const result = await DatabaseService.query(
      `SELECT 
        dominant_emotion,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_sentiment
      FROM sentiment_analysis
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dominant_emotion
      ORDER BY count DESC`,
      [req.user!.id]
    );

    const totalResult = await DatabaseService.query(
      `SELECT COUNT(*) as total
      FROM sentiment_analysis
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user!.id]
    );

    const total = totalResult.rows[0].total;

    const statistics = result.rows.map(row => ({
      emotion: row.dominant_emotion,
      count: parseInt(row.count),
      percentage: (parseInt(row.count) / total * 100).toFixed(2),
      avgSentiment: parseFloat(row.avg_sentiment).toFixed(2),
    }));

    res.json({
      statistics,
      total,
      period: '30 days',
    });
  } catch (error) {
    logger.error('Get emotion statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve emotion statistics' });
  }
});

export default router;