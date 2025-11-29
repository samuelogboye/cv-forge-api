import {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  isPasswordValid,
  isEmailValid,
} from '@/lib/auth';

describe('Auth Utilities', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const decoded = verifyToken(expiredToken);

      expect(decoded).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'MySecretPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20); // Bcrypt hashes are long
    });

    it('should generate different hashes for same password', async () => {
      const password = 'MySecretPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should be different
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'MySecretPassword123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'MySecretPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid passwords', () => {
      expect(isPasswordValid('Password123!')).toBe(true);
      expect(isPasswordValid('12345678')).toBe(true);
      expect(isPasswordValid('VeryLongPassword123')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(isPasswordValid('short')).toBe(false);
      expect(isPasswordValid('1234567')).toBe(false); // 7 chars
      expect(isPasswordValid('')).toBe(false);
    });
  });

  describe('isEmailValid', () => {
    it('should return true for valid emails', () => {
      expect(isEmailValid('test@example.com')).toBe(true);
      expect(isEmailValid('user.name@domain.co.uk')).toBe(true);
      expect(isEmailValid('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isEmailValid('invalid')).toBe(false);
      expect(isEmailValid('invalid@')).toBe(false);
      expect(isEmailValid('@example.com')).toBe(false);
      expect(isEmailValid('invalid@domain')).toBe(false);
      expect(isEmailValid('')).toBe(false);
    });
  });
});
