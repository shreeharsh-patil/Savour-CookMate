import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type RecipeAnalyticsDocument = HydratedDocument<RecipeAnalytics>;

@Schema({ timestamps: true })
export class RecipeAnalytics {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Recipe", required: true, unique: true, index: true })
  recipeId: string;

  @Prop({ type: Number, default: 0 })
  recipeViews: number;

  @Prop({ type: Number, default: 0 })
  recipeSaves: number;

  @Prop({ type: Number, default: 0 })
  cookingStarts: number;

  @Prop({ type: Number, default: 0 })
  cookingCompletions: number;

  @Prop({ type: Number, default: 0, index: true })
  popularityScore: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const RecipeAnalyticsSchema = SchemaFactory.createForClass(RecipeAnalytics);

RecipeAnalyticsSchema.index({ popularityScore: -1 });
