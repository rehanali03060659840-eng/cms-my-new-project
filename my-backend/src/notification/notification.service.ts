// src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeFirebase } from '../firebase/firebase.config';
import { SendNotificationDto } from './dto/send-notification.dto';
import { BatchResponse } from 'firebase-admin/messaging';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor() {
    initializeFirebase(); // ensure app initialized
  }

  async sendMulticast(dto: SendNotificationDto): Promise<BatchResponse[]> {
    const { tokens, title, body, data } = dto;

    const chunkSize = 500;
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push(tokens.slice(i, i + chunkSize));
    }

    const results: BatchResponse[] = [];

    for (const chunk of chunks) {
      const message = {
        notification: { title, body },
        data,
        tokens: chunk,
      };

      const response = await getMessaging().sendEachForMulticast(message);

      this.logger.log(
        `Batch sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      response.responses.forEach((res, idx) => {
        if (!res.success) {
          this.logger.warn(`Failed token: ${chunk[idx]} - ${res.error?.message}`);
        }
      });

      results.push(response);
    }

    return results;
  }
}