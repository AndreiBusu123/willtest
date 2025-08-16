import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './database.service';
import { logger } from '../utils/logger';

interface UserCredentials {
  email: string;
  password: string;
}

interface RegisterData extends UserCredentials {
  username: string;
  firstName?: string;
  lastName?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

  static async register(data: RegisterData): Promise<{ user: any; tokens: TokenPair }> {
    const { email, password, username, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await DatabaseService.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    // Create user
    const result = await DatabaseService.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, first_name, last_name, role, created_at`,
      [email, username, passwordHash, firstName, lastName, uuidv4()]
    );

    const user = result.rows[0];

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Store refresh token in sessions table
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    logger.info('New user registered', { userId: user.id, email: user.email });

    return { user, tokens };
  }

  static async login(credentials: UserCredentials): Promise<{ user: any; tokens: TokenPair }> {
    const { email, password } = credentials;

    // Find user
    const result = await DatabaseService.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await DatabaseService.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove sensitive data
    delete user.password_hash;
    delete user.verification_token;
    delete user.reset_password_token;

    logger.info('User logged in', { userId: user.id, email: user.email });

    return { user, tokens };
  }

  static async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as any;

      // Check if refresh token exists in database
      const sessionResult = await DatabaseService.query(
        'SELECT * FROM sessions WHERE refresh_token = $1 AND is_active = true AND expires_at > NOW()',
        [refreshToken]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(decoded.userId);

      // Update refresh token in database
      await DatabaseService.query(
        'UPDATE sessions SET refresh_token = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE refresh_token = $3',
        [
          tokens.refreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          refreshToken
        ]
      );

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Invalidate specific session
      await DatabaseService.query(
        'UPDATE sessions SET is_active = false WHERE refresh_token = $1',
        [refreshToken]
      );
    } else {
      // Invalidate all sessions for user
      await DatabaseService.query(
        'UPDATE sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );
    }

    logger.info('User logged out', { userId });
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get user
    const result = await DatabaseService.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    // Update password
    await DatabaseService.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidate all sessions
    await this.logout(userId);

    logger.info('Password changed', { userId });
  }

  private static async generateTokens(userId: string): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await DatabaseService.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (refresh_token) DO UPDATE
       SET is_active = true, expires_at = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, refreshToken, expiresAt]
    );
  }
}