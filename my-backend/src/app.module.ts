import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { LiveMeetModule } from './live-meet/live-meet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URL');
        if (!uri) {
          console.error('[MongoDB] MONGO_URL not set. Starting without database.');
          return { uri: 'mongodb://invalid', serverSelectionTimeoutMS: 100 };
        }
        return {
          uri,
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          autoIndex: true,
          retryWrites: true,
          retryReads: true,
        };
      },
    }),
    AuthModule,
    SeedModule,
    LiveMeetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}