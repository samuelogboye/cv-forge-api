import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    console.log('❌ Database disconnected');
  }

  // Expose PrismaClient methods
  get cV() {
    return this.prisma.cV;
  }

  get user() {
    return this.prisma.user;
  }

  get subscription() {
    return this.prisma.subscription;
  }

  get userSettings() {
    return this.prisma.userSettings;
  }

  get aIUsage() {
    return this.prisma.aIUsage;
  }

  // Expose utility methods
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get $connect() {
    return this.prisma.$connect.bind(this.prisma);
  }

  get $disconnect() {
    return this.prisma.$disconnect.bind(this.prisma);
  }
}
