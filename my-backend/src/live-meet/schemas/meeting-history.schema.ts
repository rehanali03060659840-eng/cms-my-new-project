import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

class ParticipantHistory {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) userName!: string;
  @Prop({ required: true }) joinedAt!: Date;
  @Prop() leftAt?: Date;
}

@Schema({ timestamps: true })
export class MeetingHistory {
  @Prop({ required: true, unique: true, index: true }) meetingId!: string;
  @Prop({ required: true }) title!: string;
  @Prop({ required: true }) code!: string;
  @Prop({ required: true }) hostId!: string;
  @Prop({ required: true }) hostName!: string;
  @Prop({ required: true }) startedAt!: Date;
  @Prop({ required: true }) endedAt!: Date;
  @Prop({ default: 0 }) durationSeconds!: number;
  @Prop({ default: 0 }) joinedCount!: number;
  @Prop({ default: 0 }) peakParticipants!: number;
  @Prop({ type: [Object], default: [] }) participants!: ParticipantHistory[];
}
export type MeetingHistoryDocument = HydratedDocument<MeetingHistory>;
export const MeetingHistorySchema =
  SchemaFactory.createForClass(MeetingHistory);
