import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type IngredientDocument = HydratedDocument<Ingredient>;

@Schema({ timestamps: true })
export class Ingredient {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  normalizedName: string;

  @Prop({ type: String, default: "pantry" })
  category: string;

  @Prop({ type: String, default: "g" })
  defaultUnit: string;

  @Prop({ type: [String], default: [], index: true })
  aliases: string[];

  @Prop({ type: [String], default: ["pieces", "grams", "tbsp", "cups"] })
  commonUnits: string[];

  @Prop({ type: Number, default: 14 })
  defaultShelfLifeDays: number;

  @Prop({ type: String, default: "Store in a cool, dry place." })
  storageAdvice: string;

  @Prop({ type: [String], default: [] })
  commonSubstitutes: string[];
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);

IngredientSchema.index({ aliases: 1 });
IngredientSchema.index({ name: "text", normalizedName: "text", aliases: "text" });
