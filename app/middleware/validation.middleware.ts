import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { Errors } from '@/lib/errors';

/**
 * Validation middleware factory
 * Creates a validation middleware for a given Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
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
