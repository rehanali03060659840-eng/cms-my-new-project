import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WatchHistoryDocument = WatchHistory & Document;

@Schema({ timestamps: true })
export class WatchHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Episode', required: true })
  episodeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId: Types.ObjectId;

  @Prop({ default: Date.now })
  watchedAt: Date;

  @Prop({ default: 0 })
  progress: number;
}

export const WatchHistorySchema = SchemaFactory.createForClass(WatchHistory);
