import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrivacyPolicyDocument = PrivacyPolicy & Document;

@Schema({ timestamps: true }) 
export class PrivacyPolicy {
  @Prop({ required: true })
  privacytitle!: string;

  @Prop({ required: true, unique: true })
  privacySlug!: string;

  @Prop({ required: true, enum: ['published', 'unPublished'], default: 'unPublished' })
  privacyStatus!: string;

  @Prop({ required: true, enum: ['public', 'admin'], default: 'public' })
  privacyVisiblity!: string;

  @Prop({ required: true })
  privacyDate!: string; 

  @Prop({ required: true })
  privacyContent!: string;
}

export const PrivacyPolicySchema = SchemaFactory.createForClass(PrivacyPolicy);
