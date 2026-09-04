import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, default: "" })
  comment: string;

  @Prop({ type: String, default: "Just Right" })
  difficultyFeedback?: string;

  @Prop({ type: Boolean, default: true })
  wouldCookAgain?: boolean;

  @Prop({ type: String, default: "Home Cook" })
  userName: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
ReviewSchema.index({ recipeId: 1, createdAt: -1 });
