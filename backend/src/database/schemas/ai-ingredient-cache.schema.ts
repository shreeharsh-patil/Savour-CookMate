import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type AIIngredientCacheDocument = HydratedDocument<AIIngredientCache>;

@Schema({ _id: false })
export class DishSuggestion {
  @Prop({ type: String, required: true })
  dishName: string;

  @Prop({ type: [String], default: [] })
  requiredIngredients: string[];

  @Prop({ type: [String], default: [] })
  optionalIngredients: string[];

  @Prop({ type: String, default: "" })
  reason: string;

  @Prop({ type: [String], default: [] })
  missingImportantIngredients: string[];
}

export const DishSuggestionSchema = SchemaFactory.createForClass(DishSuggestion);

@Schema({ timestamps: true })
export class AIIngredientCache {
  @Prop({ type: String, required: true, unique: true, index: true })
  ingredientHash: string;

  @Prop({ type: [String], default: [] })
  ingredients: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  preferences: Record<string, any>;

  @Prop({ type: [DishSuggestionSchema], default: [] })
  suggestions: DishSuggestion[];

  @Prop({ type: String, default: "gemini-2.5-flash" })
  modelVersion: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const AIIngredientCacheSchema = SchemaFactory.createForClass(AIIngredientCache);
