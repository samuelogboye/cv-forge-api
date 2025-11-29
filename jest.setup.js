// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/cvforge_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-mock-key';
