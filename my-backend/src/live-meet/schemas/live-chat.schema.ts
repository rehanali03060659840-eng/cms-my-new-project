import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LiveChatDocument = HydratedDocument<LiveChat>;

@Schema({ timestamps: true })
export class LiveChat {
  @Prop({ required: true, index: true }) meetingId!: string;
  @Prop({ enum: ['lobby', 'room'], required: true }) scope!: 'lobby' | 'room';
  @Prop({ enum: ['message', 'question', 'answer'], default: 'message' }) type!:
    'message' | 'question' | 'answer';
  @Prop({ required: true }) senderId!: string;
  @Prop({ required: true }) senderName!: string;
  @Prop({ required: true }) text!: string;
  @Prop({ default: false }) isEdited!: boolean;
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop({ type: String, default: null }) replyTo!: string | null;
}
export const LiveChatSchema = SchemaFactory.createForClass(LiveChat);
