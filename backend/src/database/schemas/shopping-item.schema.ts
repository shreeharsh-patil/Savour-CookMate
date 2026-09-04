import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ShoppingItemDocument = HydratedDocument<ShoppingItem>;

@Schema({ timestamps: true })
export class ShoppingItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  normalizedName: string;

  @Prop({ default: "1" })
  quantity: string;

  @Prop({ default: "unit" })
  unit: string;

  @Prop({ default: false, index: true })
  isChecked: boolean;

  @Prop()
  recipeId?: string;

  @Prop({ default: "General" })
  category: string;
}

export const ShoppingItemSchema = SchemaFactory.createForClass(ShoppingItem);

ShoppingItemSchema.index({ userId: 1, isChecked: 1 });
