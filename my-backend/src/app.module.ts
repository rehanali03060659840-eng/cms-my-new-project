import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { LiveMeetModule } from './live-meet/live-meet.module';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env',
    }),
    UsersModule,
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        (() => {
          throw new Error(
            'MONGO_URL environment variable is required but was not set',
          );
        })(),
      {
        serverSelectionTimeoutMS: 5000, // Crash quickly if DB is down instead of timing out the proxy
        socketTimeoutMS: 45000, // Close idle sockets after 45s
        maxPoolSize: 10, // Limit connection pool size
      },
    ),
    AuthModule,
    // UsersModule,
    SeedModule,
    LiveMeetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
