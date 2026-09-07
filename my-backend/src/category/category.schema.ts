
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

type CategoryDocument = Category & Document;
@Schema()
export class Category {
    @Prop({required:true})
    name?:string

    @Prop({default:"active"})
    status?:string

    @Prop({required:true})
    dueDate?:string
}
export const CategorySchema = SchemaFactory.createForClass(Category)