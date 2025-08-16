import { DatabaseService } from './database.service';
import { OpenAIService } from './openai.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface StartConversationData {
  userId: string;
  title?: string;
  initialMood?: string;
}

interface MessageData {
  conversationId: string;
  userId: string;
  content: string;
  contentType?: 'text' | 'audio';
  audioUrl?: string;
}

export class ConversationService {
  static async startConversation(data: StartConversationData): Promise<any> {
    const { userId, title, initialMood } = data;

    const result = await DatabaseService.query(
      `INSERT INTO conversations (user_id, title, mood_start, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [userId, title || 'New Conversation', initialMood]
    );

    const conversation = result.rows[0];

    // Create initial system message
    await this.addMessage({
      conversationId: conversation.id,
      userId: userId,
      content: "Hello! I'm here to listen and support you. How are you feeling today?",
      contentType: 'text',
    });

    logger.info('Conversation started', { conversationId: conversation.id, userId });

    return conversation;
  }

  static async addMessage(data: MessageData): Promise<any> {
    const { conversationId, userId, content, contentType, audioUrl } = data;

    // Perform sentiment analysis
    let sentimentData = null;
    if (content && contentType === 'text') {
      try {
        sentimentData = await OpenAIService.analyzeSentiment(content);
      } catch (error) {
        logger.error('Sentiment analysis failed:', error);
      }
    }

    // Check for crisis indicators
    let crisisData = null;
    if (content) {
      try {
        crisisData = await OpenAIService.detectCrisisIndicators(content);
        if (crisisData.isCrisis) {
          // Update conversation with crisis flag
          await DatabaseService.query(
            'UPDATE conversations SET is_crisis = true WHERE id = $1',
            [conversationId]
          );
        }
      } catch (error) {
        logger.error('Crisis detection failed:', error);
      }
    }

    // Store message
    const messageResult = await DatabaseService.query(
      `INSERT INTO messages (
        conversation_id, user_id, role, content, content_type, 
        audio_url, sentiment_score, emotions, is_flagged, flag_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        conversationId,
        userId,
        'user',
        content,
        contentType || 'text',
        audioUrl,
        sentimentData?.sentiment,
        sentimentData?.emotions,
        crisisData?.isCrisis || false,
        crisisData?.isCrisis ? JSON.stringify(crisisData.indicators) : null,
      ]
    );

    const message = messageResult.rows[0];

    // Store sentiment analysis
    if (sentimentData) {
      await DatabaseService.query(
        `INSERT INTO sentiment_analysis (
          message_id, conversation_id, user_id, text_input,
          sentiment_score, emotions, dominant_emotion, keywords,
          risk_level, crisis_indicators
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          message.id,
          conversationId,
          userId,
          content,
          sentimentData.sentiment,
          sentimentData.emotions,
          this.getDominantEmotion(sentimentData.emotions),
          sentimentData.keywords,
          crisisData?.riskLevel || 'low',
          crisisData?.indicators || [],
        ]
      );
    }

    return message;
  }

  static async generateResponse(conversationId: string, userId: string): Promise<any> {
    // Get conversation history
    const historyResult = await DatabaseService.query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC 
       LIMIT 20`,
      [conversationId]
    );

    const messageHistory = historyResult.rows.map(row => ({
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
    }));

    // Get current conversation state
    const conversationResult = await DatabaseService.query(
      'SELECT * FROM conversations WHERE id = $1',
      [conversationId]
    );

    const conversation = conversationResult.rows[0];

    // Generate therapeutic response
    const therapeuticResponse = await OpenAIService.generateTherapeuticResponse({
      userId,
      conversationId,
      messageHistory,
      userMood: conversation.mood_start,
      therapeuticTechniques: conversation.therapeutic_techniques,
    });

    // Store AI response
    const responseResult = await DatabaseService.query(
      `INSERT INTO messages (
        conversation_id, user_id, role, content, content_type, metadata
      )
      VALUES ($1, $2, 'assistant', $3, 'text', $4)
      RETURNING *`,
      [
        conversationId,
        null, // AI message doesn't have a user_id
        therapeuticResponse.response,
        {
          techniques: therapeuticResponse.suggestedTechniques,
          emotionalTone: therapeuticResponse.emotionalTone,
          followUpQuestions: therapeuticResponse.followUpQuestions,
        },
      ]
    );

    // Update conversation with techniques used
    if (therapeuticResponse.suggestedTechniques.length > 0) {
      await DatabaseService.query(
        `UPDATE conversations 
         SET therapeutic_techniques = therapeutic_techniques || $1::jsonb
         WHERE id = $2`,
        [JSON.stringify(therapeuticResponse.suggestedTechniques), conversationId]
      );
    }

    return responseResult.rows[0];
  }

  static async endConversation(conversationId: string, endMood?: string): Promise<void> {
    // Generate conversation summary
    const messagesResult = await DatabaseService.query(
      'SELECT content FROM messages WHERE conversation_id = $1 ORDER BY created_at',
      [conversationId]
    );

    const summary = await this.generateSummary(messagesResult.rows.map(r => r.content));

    await DatabaseService.query(
      `UPDATE conversations 
       SET status = 'completed', ended_at = CURRENT_TIMESTAMP, 
           mood_end = $1, summary = $2
       WHERE id = $3`,
      [endMood, summary, conversationId]
    );

    logger.info('Conversation ended', { conversationId });
  }

  static async getConversationHistory(userId: string, limit = 10, offset = 0): Promise<any[]> {
    const result = await DatabaseService.query(
      `SELECT c.*, 
              COUNT(m.id) as message_count,
              MAX(m.created_at) as last_message_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  static async getConversationDetails(conversationId: string, userId: string): Promise<any> {
    // Verify user owns the conversation
    const convResult = await DatabaseService.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      throw new Error('Conversation not found');
    }

    // Get messages
    const messagesResult = await DatabaseService.query(
      `SELECT m.*, sa.emotions, sa.sentiment_score, sa.dominant_emotion
       FROM messages m
       LEFT JOIN sentiment_analysis sa ON m.id = sa.message_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return {
      conversation: convResult.rows[0],
      messages: messagesResult.rows,
    };
  }

  private static getDominantEmotion(emotions: Record<string, number>): string {
    return Object.entries(emotions).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  private static async generateSummary(messages: string[]): Promise<string> {
    // Simple summary for now - can be enhanced with AI
    const totalMessages = messages.length;
    const conversationLength = messages.join(' ').split(' ').length;
    
    return `Conversation with ${totalMessages} messages and approximately ${conversationLength} words.`;
  }
}