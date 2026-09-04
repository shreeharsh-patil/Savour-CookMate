import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Favorite, FavoriteDocument } from "../../database/schemas/favorite.schema";
import { Recipe, RecipeDocument } from "../../database/schemas/recipe.schema";

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>
  ) {}

  async getFavorites(userId: string, collectionName?: string) {
    const query: any = { userId };
    if (collectionName && collectionName.toLowerCase() !== "all") {
      query.collectionName = collectionName;
    }

    const favs = await this.favoriteModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate("recipeId")
      .lean();

    return favs
      .filter((f) => f.recipeId)
      .map((f) => ({
        id: f._id,
        recipe: f.recipeId,
        collectionName: f.collectionName,
        notes: f.notes,
        createdAt: (f as any).createdAt,
      }));
  }

  async toggleFavorite(userId: string, recipeId: string, collectionName = "Favorites") {
    const existing = await this.favoriteModel.findOne({ userId, recipeId });
    if (existing) {
      await this.favoriteModel.deleteOne({ _id: existing._id });
      return { isFavorited: false };
    }

    await this.favoriteModel.create({
      userId,
      recipeId,
      collectionName,
    });
    return { isFavorited: true };
  }

  async isFavorited(userId: string, recipeId: string) {
    const existing = await this.favoriteModel.findOne({ userId, recipeId });
    return { isFavorited: Boolean(existing) };
  }
}
