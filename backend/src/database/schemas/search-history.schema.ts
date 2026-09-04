import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class SearchHistory {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  query: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  parsedIntent?: any;

  @Prop({ type: Number, default: 0 })
  resultCount: number;
}

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);

SearchHistorySchema.index({ userId: 1, createdAt: -1 });
