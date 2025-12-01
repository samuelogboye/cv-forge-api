import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CVModule } from './cv/cv.module';
import { BillingModule } from './billing/billing.module';
import { UserModule } from './user/user.module';
import { AIModule } from './ai/ai.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    CVModule,
    BillingModule,
    UserModule,
    AIModule,
    ImportModule,
  ],
})
export class AppModule {}
