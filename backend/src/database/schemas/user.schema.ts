import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, index: true })
  firebaseUid: string;

  @Prop({ type: String, index: true })
  email?: string;

  @Prop({ type: String })
  displayName?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: Boolean, default: false })
  isGuest: boolean;

  @Prop({ type: String, enum: ["user", "admin"], default: "user", index: true })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
