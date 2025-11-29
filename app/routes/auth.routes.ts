import { Router } from '@/lib/router';
import { authController } from '@/app/controllers/auth.controller';

/**
 * Authentication routes
 * POST /auth/register - Register new user
 * POST /auth/login - Login user
 */
export function registerAuthRoutes(router: Router) {
  router.post('/auth/register', async (request, context) => {
    return authController.register(request);
  });

  router.post('/auth/login', async (request, context) => {
    return authController.login(request);
  });
}
