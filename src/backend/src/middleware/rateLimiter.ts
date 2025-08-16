import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).user?.id,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later',
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email,
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please wait before trying again.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Conversation rate limiter (more lenient for active conversations)
export const conversationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 messages per minute
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).user?.id || req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Conversation rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    res.status(429).json({
      error: 'Message rate limit exceeded',
      message: 'Please slow down your messages.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// File upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each user to 10 uploads per 5 minutes
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'Too many uploads. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});