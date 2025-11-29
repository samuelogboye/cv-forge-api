import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { Errors, APIError } from '@/lib/errors';

/**
 * Validation middleware factory
 * Creates a validation middleware for a given Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      // Check content-type header
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw APIError.BAD_REQUEST('Content-Type must be application/json');
      }

      // Get request body text first
      const text = await request.text();

      // Check if body is empty
      if (!text || text.trim() === '') {
        throw APIError.BAD_REQUEST('Request body is required');
      }

      // Try to parse JSON
      let body;
      try {
        body = JSON.parse(text);
      } catch (parseError) {
        throw APIError.BAD_REQUEST('Invalid JSON in request body');
      }

      // Validate with Zod schema
      return schema.parse(body);
    } catch (error) {
      // If it's already an APIError, re-throw it
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      // Let the error handler deal with Zod errors
      throw error;
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>, request: NextRequest): T {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  try {
    return schema.parse(params);
  } catch (error) {
    throw error;
  }
}

/**
 * Validate route parameters
 */
export function validateParams<T>(schema: ZodSchema<T>, params: any): T {
  try {
    return schema.parse(params);
  } catch (error) {
    throw error;
  }
}
