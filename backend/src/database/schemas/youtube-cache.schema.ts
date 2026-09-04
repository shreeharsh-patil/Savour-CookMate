import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type YouTubeCacheDocument = HydratedDocument<YouTubeCache>;

@Schema({ _id: false })
export class YouTubeVideoItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  channelTitle: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  embedUrl: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ default: 0 })
  durationSeconds: number;

  @Prop({ default: "" })
  views: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: "English" })
  language: string;

  @Prop({ default: 0 })
  score: number;
}

@Schema({ timestamps: true })
export class YouTubeCache {
  @Prop({ required: true, unique: true, index: true })
  cacheKey: string;

  @Prop({ index: true })
  recipeId?: string;

  @Prop({ default: "English" })
  language: string;

  @Prop({ type: [YouTubeVideoItem], default: [] })
  videos: YouTubeVideoItem[];

  @Prop({ default: Date.now })
  fetchedAt: Date;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const YouTubeCacheSchema = SchemaFactory.createForClass(YouTubeCache);
