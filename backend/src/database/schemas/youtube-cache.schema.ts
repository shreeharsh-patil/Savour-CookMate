import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type YouTubeCacheDocument = HydratedDocument<YouTubeCache>;

@Schema({ _id: false })
export class YouTubeVideoItem {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  channelTitle: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, required: true })
  thumbnailUrl: string;

  @Prop({ type: String, required: true })
  videoUrl: string;

  @Prop({ type: String, required: true })
  embedUrl: string;

  @Prop({ type: String, default: "" })
  duration?: string;

  @Prop({ type: Number, default: 0 })
  durationSeconds?: number;

  @Prop({ type: String, default: "" })
  views?: string;

  @Prop({ type: Number, default: 0 })
  viewCount?: number;

  @Prop({ type: String, default: "" })
  language?: string;

  @Prop({ type: String, enum: ["recommended", "strong", "related", "similar"] })
  matchType?: string;

  @Prop({ type: String, default: "youtube" })
  provider?: string;

  @Prop({ type: Number, default: 0 })
  score?: number;

  @Prop({ type: Number, default: 0 })
  relevanceScore?: number;
}

export const YouTubeVideoItemSchema = SchemaFactory.createForClass(YouTubeVideoItem);

@Schema({ timestamps: true })
export class YouTubeCache {
  @Prop({ type: String, required: true, unique: true, index: true })
  cacheKey: string;

  @Prop({ type: String, index: true })
  recipeId?: string;

  @Prop({ type: String, default: "" })
  recipeName?: string;

  @Prop({ type: String, default: "youtube" })
  provider?: string;

  @Prop({ type: String, default: "" })
  language: string;

  @Prop({ type: String, default: "v2" })
  rankingVersion?: string;

  @Prop({ type: String, default: "recommended" })
  filter?: string;

  @Prop({ type: [YouTubeVideoItemSchema], default: [] })
  videos: YouTubeVideoItem[];

  @Prop({ type: Date, default: Date.now })
  fetchedAt: Date;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const YouTubeCacheSchema = SchemaFactory.createForClass(YouTubeCache);
