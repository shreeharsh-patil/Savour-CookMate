import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type AICacheDocument = HydratedDocument<AICache>;

@Schema({ timestamps: true })
export class AICache {
  @Prop({ type: String, required: true, unique: true, index: true })
  cacheKey: string;

  @Prop({ type: String, required: true, index: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  responseData: any;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const AICacheSchema = SchemaFactory.createForClass(AICache);
