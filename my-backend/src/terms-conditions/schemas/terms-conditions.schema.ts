import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TermsConditionsDocument = TermsConditions & Document;

@Schema({ timestamps: true })
export class TermsConditions {
  @Prop({ required: true })
  termstitle!: string;

  @Prop({ required: true, unique: true })
  termsSlug!: string;

  @Prop({ required: true, enum: ['published', 'unPublished'], default: 'unPublished' })
  termsStatus!: string;

  @Prop({ required: true, enum: ['public', 'admin'], default: 'public' })
  termsVisiblity!: string;

  @Prop({ required: true })
  termsDate!: string;

  @Prop({ required: true })
  termsContent!: string;
}

export const TermsConditionsSchema = SchemaFactory.createForClass(TermsConditions);
