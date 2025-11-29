import { Router } from '@/lib/router';
import { authMiddleware } from '@/lib/middleware/auth.middleware';
import { cvController } from '@/app/controllers/cv.controller';

/**
 * CV routes
 * All routes require authentication
 */
export function registerCVRoutes(router: Router) {
  // GET /cvs - List all user CVs
  router.get(
    '/cvs',
    async (request, context) => {
      return cvController.getAllCVs(request, context.user.userId);
    },
    [authMiddleware]
  );

  // POST /cvs - Create new CV
  router.post(
    '/cvs',
    async (request, context) => {
      return cvController.createCV(request, context.user.userId);
    },
    [authMiddleware]
  );

  // GET /cvs/:id - Get specific CV
  router.get(
    '/cvs/:id',
    async (request, context) => {
      return cvController.getCVById(request, context.params.id, context.user.userId);
    },
    [authMiddleware]
  );

  // PUT /cvs/:id - Update CV
  router.put(
    '/cvs/:id',
    async (request, context) => {
      return cvController.updateCV(request, context.params.id, context.user.userId);
    },
    [authMiddleware]
  );

  // DELETE /cvs/:id - Delete CV
  router.delete(
    '/cvs/:id',
    async (request, context) => {
      return cvController.deleteCV(request, context.params.id, context.user.userId);
    },
    [authMiddleware]
  );
}
