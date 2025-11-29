import { PrismaClient } from '@prisma/client';

// Use singleton pattern for test database
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const testDb =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = testDb;

/**
 * Clean up database before/after tests
 */
export async function cleanDatabase() {
  const tables = [
    'AIUsage',
    'UserSettings',
    'CV',
    'Subscription',
    'User',
  ];

  for (const table of tables) {
    await testDb.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

/**
 * Disconnect from test database
 */
export async function disconnectDatabase() {
  await testDb.$disconnect();
}

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  name?: string;
  password?: string;
}) {
  const bcrypt = require('bcryptjs');

  const email = data?.email || `test-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash(data?.password || 'Password123!', 10);

  return testDb.user.create({
    data: {
      email,
      name: data?.name || 'Test User',
      passwordHash,
    },
  });
}

/**
 * Create a test CV
 */
export async function createTestCV(userId: string, data?: {
  title?: string;
  content?: string;
  template?: string;
}) {
  return testDb.cV.create({
    data: {
      userId,
      title: data?.title || 'Test Resume',
      content: data?.content || JSON.stringify({ name: 'John Doe' }),
      template: data?.template || 'modern',
    },
  });
}

/**
 * Create a test subscription
 */
export async function createTestSubscription(userId: string, data?: {
  planId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  return testDb.subscription.create({
    data: {
      userId,
      planId: data?.planId || 'pro',
      stripeCustomerId: data?.stripeCustomerId || 'cus_test_123',
      stripeSubscriptionId: data?.stripeSubscriptionId || 'sub_test_123',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    },
  });
}
