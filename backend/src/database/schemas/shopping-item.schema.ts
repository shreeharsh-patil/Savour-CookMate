import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ShoppingItemDocument = HydratedDocument<ShoppingItem>;

@Schema({ timestamps: true })
export class ShoppingItem {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  normalizedName: string;

  @Prop({ type: String, default: "1" })
  quantity: string;

  @Prop({ type: String, default: "unit" })
  unit: string;

  @Prop({ type: Boolean, default: false, index: true })
  isChecked: boolean;

  @Prop({ type: String })
  recipeId?: string;

  @Prop({ type: String, default: "General" })
  category: string;
}

export const ShoppingItemSchema = SchemaFactory.createForClass(ShoppingItem);

ShoppingItemSchema.index({ userId: 1, isChecked: 1 });
