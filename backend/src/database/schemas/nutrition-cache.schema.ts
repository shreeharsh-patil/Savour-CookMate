import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NutritionCacheDocument = HydratedDocument<NutritionCache>;

@Schema({ _id: false })
export class CachedNutrients {
  @Prop({ type: Number, default: 0 })
  calories: number;

  @Prop({ type: Number, default: 0 })
  protein: number;

  @Prop({ type: Number, default: 0 })
  carbs: number;

  @Prop({ type: Number, default: 0 })
  fat: number;

  @Prop({ type: Number, default: 0 })
  fiber: number;
}

export const CachedNutrientsSchema = SchemaFactory.createForClass(CachedNutrients);

@Schema({ timestamps: true })
export class NutritionCache {
  @Prop({ type: String, required: true, unique: true, index: true })
  normalizedIngredient: string;

  @Prop({ type: Number })
  fdcId?: number;

  @Prop({ type: CachedNutrientsSchema, required: true })
  nutrients: CachedNutrients;

  @Prop({ type: String, default: "100g" })
  servingReference: string;

  @Prop({ type: Date, default: Date.now })
  fetchedAt: Date;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const NutritionCacheSchema = SchemaFactory.createForClass(NutritionCache);
