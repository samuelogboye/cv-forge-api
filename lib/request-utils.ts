import { NextRequest } from 'next/server';
import { APIError } from '@/lib/errors';

/**
 * Safely parse JSON body from request
 * Returns parsed body or throws validation error
 * Use this instead of request.json() to get better error messages
 */
export async function parseRequestBody<T = any>(request: NextRequest): Promise<T> {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      throw APIError.BAD_REQUEST('Content-Type must be application/json');
    }

    // Try to get the text first to check if body is empty
    const text = await request.text();

    if (!text || text.trim() === '') {
      throw APIError.BAD_REQUEST('Request body is required');
    }

    // Parse JSON
    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      throw APIError.BAD_REQUEST('Invalid JSON in request body');
    }
  } catch (error) {
    // If it's already an APIError, re-throw it
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }

    // Otherwise, throw a generic bad request error
    throw APIError.BAD_REQUEST('Failed to parse request body');
  }
}

/**
 * Safely get JSON from request with fallback
 * Use this when body is optional
 */
export async function parseOptionalRequestBody<T = any>(
  request: NextRequest
): Promise<T | null> {
  try {
    return await parseRequestBody<T>(request);
  } catch (error) {
    return null;
  }
}

/**
 * Validate that request body is not empty
 */
export function validateBodyNotEmpty(body: any): void {
  if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
    throw APIError.BAD_REQUEST('Request body cannot be empty');
  }
}
