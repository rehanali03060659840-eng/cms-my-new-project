import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EpisodeDocument = Episode & Document;

@Schema({ timestamps: true })
export class Episode {
  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId!: Types.ObjectId;

  @Prop({ required: true, default: 1, min: 1 })
  seasonNumber!: number;

  @Prop({ required: true, min: 1 })
  episodeNumber!: number;

  @Prop({ required: true })
  videoUrl!: string;

  @Prop({ default: null })
  thumbnailUrl!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;

  @Prop({ default: 0 })
  views!: number;
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);