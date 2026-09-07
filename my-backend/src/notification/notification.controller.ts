// src/notification/notification.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendMulticast(dto);
  }
}