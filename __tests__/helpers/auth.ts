import jwt from 'jsonwebtoken';

/**
 * Generate a test JWT token
 */
export function generateTestToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * Create authorization header for tests
 */
export function createAuthHeader(userId: string, email: string): {
  Authorization: string;
} {
  const token = generateTestToken(userId, email);
  return {
    Authorization: `Bearer ${token}`,
  };
}
