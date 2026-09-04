import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: "" })
  comment: string;

  @Prop({ default: "Home Cook" })
  userName: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
ReviewSchema.index({ recipeId: 1, createdAt: -1 });
