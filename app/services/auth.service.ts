import { db } from '@/lib/db';
import { generateToken, hashPassword, comparePassword } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import type { RegisterInput, LoginInput } from '@/lib/validations';

/**
 * Auth Service
 * Contains business logic for authentication
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw Errors.EMAIL_EXISTS();
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    // Check if user exists and not deleted
    if (!user || user.deletedAt) {
      throw Errors.INVALID_CREDENTIALS();
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw Errors.INVALID_CREDENTIALS();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    return user;
  }
}

// Export singleton instance
export const authService = new AuthService();
