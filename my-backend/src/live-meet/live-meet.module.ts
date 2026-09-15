import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LiveMeetGateway } from './live-meet.gateway';
import { LiveMeetController } from './live-meet.controller';
import { LiveMeetService } from './live-meet.service';

import { LiveChat, LiveChatSchema } from './schemas/live-chat.schema';
import {
  MeetingHistory,
  MeetingHistorySchema,
} from './schemas/meeting-history.schema';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      {
        name: LiveChat.name,
        schema: LiveChatSchema,
      },
      {
        name: MeetingHistory.name,
        schema: MeetingHistorySchema,
      },
    ]),
  ],

  controllers: [LiveMeetController],

  providers: [LiveMeetGateway, LiveMeetService],

  exports: [LiveMeetService],
})
export class LiveMeetModule {}
