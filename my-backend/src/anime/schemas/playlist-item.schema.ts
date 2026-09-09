import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlaylistItemDocument = PlaylistItem & Document;

@Schema({ timestamps: true })
export class PlaylistItem {
  @Prop({ type: Types.ObjectId, ref: 'Playlist', required: true })
  playlistId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId!: Types.ObjectId;
}

export const PlaylistItemSchema = SchemaFactory.createForClass(PlaylistItem);