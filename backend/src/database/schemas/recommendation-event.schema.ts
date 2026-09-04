import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type RecommendationEventDocument = HydratedDocument<RecommendationEvent>;

@Schema({ timestamps: { createdAt: "timestamp", updatedAt: false } })
export class RecommendationEvent {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ required: true, enum: ["view", "save", "cook", "complete", "rate", "skip"], index: true })
  eventType: string;

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const RecommendationEventSchema = SchemaFactory.createForClass(RecommendationEvent);

RecommendationEventSchema.index({ userId: 1, eventType: 1 });
