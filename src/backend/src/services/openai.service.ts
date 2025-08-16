import OpenAI from 'openai';
import { logger } from '../utils/logger';

interface ConversationContext {
  userId: string;
  conversationId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userMood?: string;
  therapeuticTechniques?: string[];
}

interface TherapeuticResponse {
  response: string;
  suggestedTechniques: string[];
  emotionalTone: string;
  followUpQuestions: string[];
}

export class OpenAIService {
  private static openai: OpenAI;
  private static readonly MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  private static readonly MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 2000;
  private static readonly TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE) || 0.7;

  static initialize(): void {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('OpenAI service initialized');
  }

  static async generateTherapeuticResponse(
    context: ConversationContext
  ): Promise<TherapeuticResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...context.messageHistory.slice(-10), // Last 10 messages for context
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages,
        temperature: this.TEMPERATURE,
        max_tokens: this.MAX_TOKENS,
        response_format: { type: 'json_object' },
        functions: [
          {
            name: 'therapeutic_response',
            description: 'Generate a therapeutic response with techniques and follow-up questions',
            parameters: {
              type: 'object',
              properties: {
                response: {
                  type: 'string',
                  description: 'The main therapeutic response to the user',
                },
                suggestedTechniques: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Therapeutic techniques being applied',
                },
                emotionalTone: {
                  type: 'string',
                  description: 'The emotional tone of the response (supportive, encouraging, calming, etc.)',
                },
                followUpQuestions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Follow-up questions to deepen the conversation',
                },
              },
              required: ['response', 'suggestedTechniques', 'emotionalTone', 'followUpQuestions'],
            },
          },
        ],
        function_call: { name: 'therapeutic_response' },
      });

      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall) {
        throw new Error('No function call in response');
      }

      const result = JSON.parse(functionCall.arguments);

      logger.info('Therapeutic response generated', {
        conversationId: context.conversationId,
        techniques: result.suggestedTechniques,
      });

      return result;
    } catch (error) {
      logger.error('OpenAI service error:', error);
      throw new Error('Failed to generate therapeutic response');
    }
  }

  static async analyzeSentiment(text: string): Promise<{
    sentiment: number;
    emotions: Record<string, number>;
    keywords: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the emotional content of the text.',
          },
          {
            role: 'user',
            content: `Analyze the sentiment and emotions in this text: "${text}"`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        functions: [
          {
            name: 'sentiment_analysis',
            description: 'Analyze sentiment and emotions in text',
            parameters: {
              type: 'object',
              properties: {
                sentiment: {
                  type: 'number',
                  description: 'Overall sentiment score from -1 (negative) to 1 (positive)',
                },
                emotions: {
                  type: 'object',
                  properties: {
                    joy: { type: 'number' },
                    sadness: { type: 'number' },
                    anger: { type: 'number' },
                    fear: { type: 'number' },
                    surprise: { type: 'number' },
                    disgust: { type: 'number' },
                  },
                  description: 'Emotion scores from 0 to 1',
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key emotional words or phrases',
                },
              },
              required: ['sentiment', 'emotions', 'keywords'],
            },
          },
        ],
        function_call: { name: 'sentiment_analysis' },
      });

      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall) {
        throw new Error('No function call in response');
      }

      return JSON.parse(functionCall.arguments);
    } catch (error) {
      logger.error('Sentiment analysis error:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  static async detectCrisisIndicators(text: string): Promise<{
    isCrisis: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    suggestedActions: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a mental health crisis detection specialist. Analyze text for crisis indicators 
            including suicidal ideation, self-harm, severe depression, or immediate danger. Be thorough but careful not to over-diagnose.`,
          },
          {
            role: 'user',
            content: `Analyze this text for crisis indicators: "${text}"`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        functions: [
          {
            name: 'crisis_detection',
            description: 'Detect crisis indicators in text',
            parameters: {
              type: 'object',
              properties: {
                isCrisis: {
                  type: 'boolean',
                  description: 'Whether crisis indicators are present',
                },
                riskLevel: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Overall risk level assessment',
                },
                indicators: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific crisis indicators found',
                },
                suggestedActions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended immediate actions',
                },
              },
              required: ['isCrisis', 'riskLevel', 'indicators', 'suggestedActions'],
            },
          },
        ],
        function_call: { name: 'crisis_detection' },
      });

      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall) {
        throw new Error('No function call in response');
      }

      const result = JSON.parse(functionCall.arguments);

      if (result.isCrisis) {
        logger.warn('Crisis indicators detected', result);
      }

      return result;
    } catch (error) {
      logger.error('Crisis detection error:', error);
      throw new Error('Failed to detect crisis indicators');
    }
  }

  private static buildSystemPrompt(context: ConversationContext): string {
    const techniques = context.therapeuticTechniques?.join(', ') || 'CBT, active listening, empathy';
    
    return `You are a compassionate and professional AI therapeutic assistant. Your role is to provide 
    supportive, empathetic responses while maintaining appropriate boundaries.

    Guidelines:
    1. Use therapeutic techniques including: ${techniques}
    2. Be empathetic and non-judgmental
    3. Ask open-ended questions to encourage self-reflection
    4. Validate feelings while encouraging healthy coping strategies
    5. Never provide medical diagnoses or medication advice
    6. If you detect crisis indicators, express concern and suggest professional help
    7. Maintain a warm, professional tone
    8. Focus on the user's strengths and resilience
    9. Current user mood: ${context.userMood || 'unknown'}
    
    Remember: You are not a replacement for professional therapy. Encourage users to seek 
    professional help when appropriate.`;
  }
}