import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type CookingHistoryDocument = HydratedDocument<CookingHistory>;

@Schema({ timestamps: { createdAt: "cookedAt", updatedAt: false } })
export class CookingHistory {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ type: String, required: true })
  recipeName: string;

  @Prop({ type: String, required: true })
  recipeImage: string;

  @Prop({ type: Number, default: 0 })
  durationMinutes: number;

  @Prop({ type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ type: String, default: "" })
  notes: string;

  cookedAt?: Date;
}

export const CookingHistorySchema = SchemaFactory.createForClass(CookingHistory);

CookingHistorySchema.index({ userId: 1, cookedAt: -1 });
