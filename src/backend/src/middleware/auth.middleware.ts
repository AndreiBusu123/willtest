import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database.service';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err: any, decoded: any) => {
        if (err) {
          logger.warn('Invalid token attempt', { error: err.message });
          res.status(403).json({ error: 'Invalid or expired token' });
          return;
        }

        // Verify user still exists and is active
        const result = await DatabaseService.query(
          'SELECT id, email, role, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
          res.status(403).json({ error: 'User not found or inactive' });
          return;
        }

        req.user = {
          id: decoded.userId,
          email: result.rows[0].email,
          role: result.rows[0].role,
        };

        next();
      }
    );
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err: any, decoded: any) => {
        if (!err && decoded) {
          const result = await DatabaseService.query(
            'SELECT id, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
          );

          if (result.rows.length > 0 && result.rows[0].is_active) {
            req.user = {
              id: decoded.userId,
              email: result.rows[0].email,
              role: result.rows[0].role,
            };
          }
        }
        next();
      }
    );
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};