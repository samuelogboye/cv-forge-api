import { createRouter } from '@/lib/router';
import { registerAuthRoutes } from './auth.routes';
import { registerCVRoutes } from './cv.routes';
// Import other route registrations as you create them
// import { registerBillingRoutes } from './billing.routes';
// import { registerUserRoutes } from './user.routes';
// import { registerAIRoutes } from './ai.routes';

/**
 * Main API Router
 * Registers all application routes
 */
export function createAPIRouter() {
  const router = createRouter();

  // Register domain routes
  registerAuthRoutes(router);
  registerCVRoutes(router);
  // registerBillingRoutes(router);
  // registerUserRoutes(router);
  // registerAIRoutes(router);

  return router;
}

/**
 * Get singleton router instance
 */
let routerInstance: ReturnType<typeof createRouter> | null = null;

export function getAPIRouter() {
  if (!routerInstance) {
    routerInstance = createAPIRouter();
  }
  return routerInstance;
}
