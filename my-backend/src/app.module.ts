import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from './category/category.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { IndexController } from './blog/index/index.controller';
import { IndexModule } from './blog/index/index.module';
import { IndexService } from './blog/index/index.service';
import { UploadModule } from './upload/upload.module';
import { PrivacyPolicyController } from './privacy-policy/privacy-policy.controller';
import { PrivacyPolicyService } from './privacy-policy/privacy-policy.service';
import { PrivacyPolicyModule } from './privacy-policy/privacy-policy.module';
import { TermsConditionsModule } from './terms-conditions/terms-conditions.module';
import { TermsConditionsController } from './terms-conditions/terms-conditions.controller';
import { TermsConditionsService } from './terms-conditions/terms-conditions.service';
import { ReelsService } from './reels/reels.service';
import { ReelsController } from './reels/reels.controller';
import { ReelsModule } from './reels/reels.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { LiveMeetModule } from './live-meet/live-meet.module';
import { AnimeModule } from './anime/anime.module';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env',
    }),
    CategoryModule,
    UsersModule,
    MongooseModule.forRoot(
      'mongodb+srv://rehanali03060659840_db_user:Saify786@cluster0.oaqiruq.mongodb.net/LiveMeet?retryWrites=true&w=majority&appName=Cluster0',
    ),
    AuthModule,
    IndexModule,
    UploadModule,
    PrivacyPolicyModule,
    TermsConditionsModule,
    ReelsModule,
    DashboardModule,
    NotificationModule,
    // UsersModule,
    SeedModule,
    LiveMeetModule,
    AnimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
