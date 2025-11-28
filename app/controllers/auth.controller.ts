import { NextRequest } from 'next/server';
import { authService } from '@/app/services/auth.service';
import { validateBody } from '@/app/middleware/validation.middleware';
import { registerSchema, loginSchema } from '@/lib/validations';
import { successResponse } from '@/lib/errors';

/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(request: NextRequest) {
    const validated = await validateBody(registerSchema)(request);
    const result = await authService.register(validated);
    return successResponse(result, 201);
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(request: NextRequest) {
    const validated = await validateBody(loginSchema)(request);
    const result = await authService.login(validated);
    return successResponse(result);
  }
}

// Export singleton instance
export const authController = new AuthController();
