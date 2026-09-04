import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type CookingHistoryDocument = HydratedDocument<CookingHistory>;

@Schema({ timestamps: { createdAt: "cookedAt", updatedAt: false } })
export class CookingHistory {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ required: true })
  recipeName: string;

  @Prop({ required: true })
  recipeImage: string;

  @Prop({ default: 0 })
  durationMinutes: number;

  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ default: "" })
  notes: string;
}

export const CookingHistorySchema = SchemaFactory.createForClass(CookingHistory);

CookingHistorySchema.index({ userId: 1, cookedAt: -1 });
