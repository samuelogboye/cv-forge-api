import { NextResponse } from 'next/server';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Common error types
 */
export const Errors = {
  // Authentication errors (401)
  UNAUTHORIZED: (message = 'Unauthorized') =>
    new APIError(message, 401, 'UNAUTHORIZED'),
  INVALID_TOKEN: () =>
    new APIError('Invalid or expired token', 401, 'INVALID_TOKEN'),
  INVALID_CREDENTIALS: () =>
    new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),

  // Authorization errors (403)
  FORBIDDEN: (message = 'Forbidden') =>
    new APIError(message, 403, 'FORBIDDEN'),
  RESOURCE_NOT_FOUND: () =>
    new APIError('Resource not found or access denied', 403, 'RESOURCE_NOT_FOUND'),

  // Validation errors (400)
  BAD_REQUEST: (message: string) =>
    new APIError(message, 400, 'BAD_REQUEST'),
  INVALID_INPUT: (message: string) =>
    new APIError(message, 400, 'INVALID_INPUT'),
  MISSING_FIELDS: (fields: string[]) =>
    new APIError(
      `Missing required fields: ${fields.join(', ')}`,
      400,
      'MISSING_FIELDS'
    ),

  // Conflict errors (409)
  CONFLICT: (message: string) =>
    new APIError(message, 409, 'CONFLICT'),
  EMAIL_EXISTS: () =>
    new APIError('Email already exists', 409, 'EMAIL_EXISTS'),

  // Not found errors (404)
  NOT_FOUND: (resource = 'Resource') =>
    new APIError(`${resource} not found`, 404, 'NOT_FOUND'),

  // Rate limit errors (429)
  RATE_LIMIT: () =>
    new APIError('Too many requests. Please try again later.', 429, 'RATE_LIMIT'),

  // Server errors (500)
  INTERNAL_ERROR: (message = 'Internal server error') =>
    new APIError(message, 500, 'INTERNAL_ERROR'),
};

/**
 * Handle errors and return appropriate response
 */
export function errorResponse(error: unknown): NextResponse {
  // Log error for debugging
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: zodError.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // Default to internal server error
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function successResponse(data: any, statusCode = 200): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}
