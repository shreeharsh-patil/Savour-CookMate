import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IngredientDocument = HydratedDocument<Ingredient>;

@Schema({ timestamps: true })
export class Ingredient {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  normalizedName: string;

  @Prop({ default: "pantry" })
  category: string;

  @Prop({ type: [String], default: ["pieces", "grams", "tbsp", "cups"] })
  commonUnits: string[];

  @Prop({ default: 14 })
  defaultShelfLifeDays: number;

  @Prop({ default: "Store in a cool, dry place." })
  storageAdvice: string;

  @Prop({ type: [String], default: [] })
  commonSubstitutes: string[];
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);
