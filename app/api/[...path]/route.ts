import { NextRequest } from 'next/server';
import { getAPIRouter } from '@/app/routes';

/**
 * Catch-all API route handler
 * Routes all /api/* requests through the custom router
 */
const router = getAPIRouter();

export async function GET(request: NextRequest) {
  return router.handle(request);
}

export async function POST(request: NextRequest) {
  return router.handle(request);
}

export async function PUT(request: NextRequest) {
  return router.handle(request);
}

export async function DELETE(request: NextRequest) {
  return router.handle(request);
}

export async function PATCH(request: NextRequest) {
  return router.handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return router.handle(request);
}
