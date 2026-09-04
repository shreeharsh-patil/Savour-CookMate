import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PantryItemDocument = HydratedDocument<PantryItem>;

@Schema({ timestamps: true })
export class PantryItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop()
  ingredientId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  normalizedName: string;

  @Prop({ default: "1" })
  quantity: string;

  @Prop({ default: "unit" })
  unit: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ default: false, index: true })
  lowStock: boolean;
}

export const PantryItemSchema = SchemaFactory.createForClass(PantryItem);

PantryItemSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });
PantryItemSchema.index({ userId: 1, expiryDate: 1 });
