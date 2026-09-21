import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Resolve uploads directory from env or fall back to CWD (cloud-safe)
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
    origin: [
      'https://live-meet-ff137.web.app',
      'https://live-meet-ffc37.web.app',
      'https://ff137.web.app',
      'https://ffc37.web.app',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  // Keep-alive & timeout tweaks to prevent proxy drops (QUIC/HTTP2)
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000;

  console.log(`Backend running on port ${port}`);
}

void bootstrap();
