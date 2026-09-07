
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Content {
  @Prop({ type: String, required: true })
  html!: string;

  @Prop({ type: String, required: true })
  text!: string;
}

@Schema({ _id: false })
export class FaqItem {
  @Prop({ type: String })
  question!: string;

  @Prop({ type: String })
  answer!: string;
}

@Schema({ _id: false })
export class Serp {
  @Prop({ type: String })
  title!: string;

  @Prop({ type: String })
  description!: string;
}

@Schema({ _id: false })
export class Meta {
  @Prop({ type: String })
  metaTitle!: string;

  @Prop({ type: String })
  shortDescription!: string;

  @Prop({ type: String })
  longDescription!: string;

  @Prop({ type: [String] })
  focusKeywords!: string[];

  @Prop({ type: [String] })
  tags!: string[];
}

@Schema({ _id: false })
export class MediaItem {
  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, enum: ['image', 'video'], required: true })
  type!: string;

  @Prop({ type: Boolean, default: false })
  isThumbnail!: boolean;

  @Prop({ type: String })
  alt?: string;
}

export type IndexDocument = Index & Document;

@Schema({ timestamps: true })
export class Index {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String })
  shortInfo!: string;

  @Prop({ type: String })
  thumbnail!: string;

  @Prop({ type: [MediaItem], default: [] })
  media!: MediaItem[];

  @Prop({ type: Content, required: true })
  content!: Content;

  @Prop({ type: [FaqItem], default: [] })
  faq!: FaqItem[];

  @Prop({ type: Serp })
  serp!: Serp;

  @Prop({ type: Meta })
  meta!: Meta;

  @Prop({ type: Object, default: {} })
  schema!: Record<string, any>;

  @Prop({ type: String, required: true, unique: true })
  slug!: string;

  @Prop({ type: String, enum: ['draft', 'published'], default: 'draft' })
  status!: string;
}

export const IndexSchema = SchemaFactory.createForClass(Index);