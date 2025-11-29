import { NextRequest } from 'next/server';
import { UserController } from '@/app/controllers/user.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.updatePreferences(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
