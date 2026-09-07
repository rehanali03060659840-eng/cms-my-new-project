import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ReelDocument = Reel & Document;

@Schema({ timestamps: true })
export class Reel {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  videoUrl!: string;

  @Prop({ required: true })
  playableUrl!: string;

  @Prop({ required: true })
  thumbnail!: string; 

  @Prop({ required: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  category!: Types.ObjectId;

  @Prop({ default: "active" })
  status!: string;
}

export const ReelSchema = SchemaFactory.createForClass(Reel);