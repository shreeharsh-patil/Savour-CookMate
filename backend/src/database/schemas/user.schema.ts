import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid: string;

  @Prop({ index: true })
  email?: string;

  @Prop()
  displayName?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  isGuest: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
