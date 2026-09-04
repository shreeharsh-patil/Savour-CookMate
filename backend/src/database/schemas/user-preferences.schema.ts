import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserPreferencesDocument = HydratedDocument<UserPreferences>;

@Schema({ timestamps: true })
export class UserPreferences {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: "all" })
  diet: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  favoriteCuisines: string[];

  @Prop({ default: "beginner" })
  cookingSkill: string;

  @Prop({ type: [String], default: ["English"] })
  preferredLanguages: string[];

  @Prop({ default: 45 })
  maximumCookingTime: number;

  @Prop({ default: "medium" })
  spicePreference: string;
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);
