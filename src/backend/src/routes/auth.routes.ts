import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const validatePasswordChange = [
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// Register endpoint
router.post('/register', validateRegister, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await AuthService.register(req.body);
    
    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await AuthService.login(req.body);
    
    res.json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokens = await AuthService.refreshTokens(refreshToken);
    
    res.json({
      message: 'Tokens refreshed successfully',
      tokens,
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    await AuthService.logout(req.user!.id, refreshToken);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Change password endpoint
router.post(
  '/change-password',
  authenticateToken,
  validatePasswordChange,
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { oldPassword, newPassword } = req.body;
      
      await AuthService.changePassword(req.user!.id, oldPassword, newPassword);
      
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      logger.error('Password change error:', error);
      
      if (error.message === 'Invalid current password') {
        return res.status(401).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Password change failed' });
    }
  }
);

// Verify token endpoint
router.get('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router;