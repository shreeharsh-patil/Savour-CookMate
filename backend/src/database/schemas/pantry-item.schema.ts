import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PantryItemDocument = HydratedDocument<PantryItem>;

@Schema({ timestamps: true })
export class PantryItem {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String })
  ingredientId?: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  normalizedName: string;

  @Prop({ type: String, default: "1" })
  quantity: string;

  @Prop({ type: String, default: "unit" })
  unit: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: Boolean, default: false, index: true })
  lowStock: boolean;
}

export const PantryItemSchema = SchemaFactory.createForClass(PantryItem);

PantryItemSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });
PantryItemSchema.index({ userId: 1, expiryDate: 1 });
