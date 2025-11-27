import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, hashPassword } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { registerSchema } from '@/lib/validations';

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw Errors.EMAIL_EXISTS();
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
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

    // Return user and token
    return successResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
        },
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
