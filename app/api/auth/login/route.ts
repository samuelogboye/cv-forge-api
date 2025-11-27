import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, comparePassword } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { loginSchema } from '@/lib/validations';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validated.email },
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
    const isPasswordValid = await comparePassword(
      validated.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw Errors.INVALID_CREDENTIALS();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Return user and token (without password hash)
    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
