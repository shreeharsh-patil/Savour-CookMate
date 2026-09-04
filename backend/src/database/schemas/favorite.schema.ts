import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Favorite {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId, ref: "Recipe" })
  recipeId: string;

  @Prop({ default: "Favorites", index: true })
  collectionName: string;

  @Prop({ default: "" })
  notes: string;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, collectionName: 1 });
