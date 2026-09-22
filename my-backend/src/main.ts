import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  try {
    mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }

  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: 'https://live-meet-ffc37.web.app',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Backend running on port ${port}`);
}

void bootstrap();
