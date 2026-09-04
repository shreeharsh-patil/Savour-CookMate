import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RecipeDocument = HydratedDocument<Recipe>;

@Schema({ _id: false })
export class RecipeIngredient {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  normalizedName: string;

  @Prop({ required: true })
  quantity: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ default: false })
  optional: boolean;

  @Prop({ default: "pantry" })
  category: string;
}

@Schema({ _id: false })
export class RecipeStep {
  @Prop({ required: true })
  stepNumber: number;

  @Prop({ required: true })
  instruction: string;

  @Prop({ default: 0 })
  timerMinutes: number;

  @Prop()
  chefTip?: string;

  @Prop({ type: [String], default: [] })
  requiredEquipment: string[];
}

@Schema({ _id: false })
export class RecipeNutrition {
  @Prop({ default: 0 })
  calories: number;

  @Prop({ default: 0 })
  protein: number;

  @Prop({ default: 0 })
  carbs: number;

  @Prop({ default: 0 })
  fat: number;

  @Prop({ default: 0 })
  fiber: number;
}

@Schema({ _id: false })
export class RecipeSubstitution {
  @Prop({ required: true })
  ingredient: string;

  @Prop({ required: true })
  substitute: string;

  @Prop({ default: "" })
  note: string;
}

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ required: true, index: true })
  cuisine: string;

  @Prop({ type: [String], default: [], index: true })
  mealTypes: string[];

  @Prop({ type: [String], default: [], index: true })
  dietaryTags: string[];

  @Prop({ default: "Medium" })
  difficulty: string;

  @Prop({ default: 15 })
  prepTime: number;

  @Prop({ default: 25 })
  cookTime: number;

  @Prop({ default: 40, index: true })
  totalTime: number;

  @Prop({ default: 2 })
  servings: number;

  @Prop({ type: [RecipeIngredient], default: [] })
  ingredients: RecipeIngredient[];

  @Prop({ type: [RecipeStep], default: [] })
  steps: RecipeStep[];

  @Prop({ type: RecipeNutrition, default: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) })
  nutrition: RecipeNutrition;

  @Prop({ type: [String], default: [] })
  allergens: string[];

  @Prop({ type: [String], default: [] })
  equipment: string[];

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  youtubeSearchQuery?: string;

  @Prop({ type: [RecipeSubstitution], default: [] })
  substitutions: RecipeSubstitution[];

  @Prop({ type: [String], default: [] })
  tips: string[];

  // Real user-generated statistics only
  @Prop({ type: Number, default: null, index: true })
  averageRating: number | null;

  @Prop({ type: Number, default: 0 })
  ratingCount: number;

  @Prop({ type: Number, default: 0, index: true })
  cookCount: number;

  @Prop({ type: [String], default: [], index: true })
  searchKeywords: string[];

  @Prop({ default: "published", index: true })
  status: string;

  @Prop({ default: 1 })
  version: number;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

// Search and performance indexes
RecipeSchema.index({ name: "text", description: "text", searchKeywords: "text", cuisine: "text" });
RecipeSchema.index({ cuisine: 1, totalTime: 1 });
RecipeSchema.index({ status: 1, cookCount: -1 });
RecipeSchema.index({ "ingredients.normalizedName": 1 });
