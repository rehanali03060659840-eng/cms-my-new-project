import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://live-meet-ffc37.web.app',
      'https://live-meet-ffc37.firebaseapp.com',
    ],
    credentials: true,
  });

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Backend running on port ${port}`);
}

bootstrap();