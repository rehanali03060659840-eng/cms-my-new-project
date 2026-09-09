import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeriesDocument = Series & Document;

@Schema({ timestamps: true })
export class Series {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  coverImageUrl!: string;

  @Prop({ type: [String], required: true, minlength: 3 })
  categories!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;
}

export const SeriesSchema = SchemaFactory.createForClass(Series);