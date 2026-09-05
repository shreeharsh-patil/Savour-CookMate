import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RecipeDocument = HydratedDocument<Recipe>;

@Schema({ _id: false })
export class RecipeIngredient {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  normalizedName: string;

  @Prop({ type: String, required: true })
  quantity: string;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: Boolean, default: false })
  optional: boolean;

  @Prop({ type: String, default: "pantry" })
  category: string;
}

@Schema({ _id: false })
export class RecipeStep {
  @Prop({ type: Number, required: true })
  stepNumber: number;

  @Prop({ type: String, required: true })
  instruction: string;

  @Prop({ type: Number, default: 0 })
  timerMinutes: number;

  @Prop({ type: String })
  chefTip?: string;

  @Prop({ type: [String], default: [] })
  requiredEquipment: string[];
}

@Schema({ _id: false })
export class RecipeNutrition {
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

@Schema({ _id: false })
export class RecipeSubstitution {
  @Prop({ type: String, required: true })
  ingredient: string;

  @Prop({ type: String, required: true })
  substitute: string;

  @Prop({ type: String, default: "" })
  note: string;
}

export const RecipeIngredientSchema = SchemaFactory.createForClass(RecipeIngredient);
export const RecipeStepSchema = SchemaFactory.createForClass(RecipeStep);
export const RecipeNutritionSchema = SchemaFactory.createForClass(RecipeNutrition);
export const RecipeSubstitutionSchema = SchemaFactory.createForClass(RecipeSubstitution);

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, required: true, index: true })
  name: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, required: false, index: true })
  cuisine?: string;

  @Prop({ type: [String], default: [], index: true })
  mealTypes: string[];

  @Prop({ type: [String], default: [], index: true })
  dietaryTags: string[];

  @Prop({ type: String, required: false })
  difficulty?: string;

  @Prop({ type: Number, required: false })
  prepTime?: number;

  @Prop({ type: Number, required: false })
  cookTime?: number;

  @Prop({ type: Number, required: false, index: true })
  totalTime?: number;

  @Prop({ type: Number, required: false })
  servings?: number;

  @Prop({ type: String, required: false, index: true })
  category?: string;

  @Prop({ type: [RecipeIngredientSchema], default: [] })
  ingredients: RecipeIngredient[];

  @Prop({ type: [RecipeStepSchema], default: [] })
  steps: RecipeStep[];

  @Prop({ type: [String], default: [] })
  instructions: string[];

  @Prop({ type: Boolean, default: false, index: true })
  isHydrated: boolean;

  @Prop({ type: Date })
  detailFetchedAt?: Date;

  @Prop({ type: RecipeNutritionSchema, default: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) })
  nutrition: RecipeNutrition;

  @Prop({ type: [String], default: [] })
  allergens: string[];

  @Prop({ type: [String], default: [] })
  equipment: string[];

  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: String, default: "" })
  thumbnailUrl: string;

  @Prop({ type: String, default: "curated" })
  imageSource: string;

  @Prop({ type: String })
  youtubeSearchQuery?: string;

  @Prop({ type: String })
  youtubeUrl?: string;

  @Prop({ type: String, index: true })
  youtubeVideoId?: string;

  @Prop({ type: [RecipeSubstitutionSchema], default: [] })
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
  tags: string[];

  @Prop({ type: [String], default: [], index: true })
  searchKeywords: string[];

  @Prop({ type: String, default: "curated" })
  source: string;

  @Prop({ type: String, default: "curated", index: true })
  provider: string;

  @Prop({ type: String, index: true })
  externalId?: string;

  @Prop({ type: String })
  sourceUrl?: string;

  @Prop({ type: Date, default: Date.now })
  lastSyncedAt: Date;

  @Prop({ type: Number, default: 0, index: true })
  popularityScore: number;

  @Prop({ type: String, default: "published", index: true })
  status: string;

  @Prop({ type: Number, default: 1 })
  version: number;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

// Search and performance indexes
RecipeSchema.index({ name: "text", description: "text", searchKeywords: "text", cuisine: "text" });
RecipeSchema.index({ cuisine: 1, totalTime: 1 });
RecipeSchema.index({ status: 1, cookCount: -1 });
RecipeSchema.index({ status: 1, popularityScore: -1 });
RecipeSchema.index({ status: 1, provider: 1, externalId: 1 });
RecipeSchema.index({ status: 1, "ingredients.normalizedName": 1 });
RecipeSchema.index({ status: 1, category: 1 });
RecipeSchema.index({ status: 1, cuisine: 1 });
RecipeSchema.index({ status: 1, dietaryTags: 1 });
