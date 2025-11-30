import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CVForge API')
    .setDescription('AI-powered resume builder API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('cvs', 'CV management endpoints')
    .addTag('billing', 'Billing and subscription endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('ai', 'AI optimization endpoints')
    .addTag('import', 'Resume import endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`🚀 CVForge API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api-docs`);
}

bootstrap();
