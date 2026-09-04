import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserPreferencesDocument = HydratedDocument<UserPreferences>;

@Schema({ timestamps: true })
export class UserPreferences {
  @Prop({ type: String, required: true, unique: true, index: true })
  userId: string;

  @Prop({ type: String, default: "all" })
  diet: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  favoriteCuisines: string[];

  @Prop({ type: String, default: "beginner" })
  cookingSkill: string;

  @Prop({ type: [String], default: ["English"] })
  preferredLanguages: string[];

  @Prop({ type: Number, default: 45 })
  maximumCookingTime: number;

  @Prop({ type: String, default: "medium" })
  spicePreference: string;
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);
