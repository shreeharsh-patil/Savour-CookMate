import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../../database/schemas/user.schema";
import { UserPreferences, UserPreferencesDocument } from "../../database/schemas/user-preferences.schema";
import { Favorite, FavoriteDocument } from "../../database/schemas/favorite.schema";
import { CookingHistory, CookingHistoryDocument } from "../../database/schemas/cooking-history.schema";
import { PantryItem, PantryItemDocument } from "../../database/schemas/pantry-item.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserPreferences.name) private prefModel: Model<UserPreferencesDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(CookingHistory.name) private historyModel: Model<CookingHistoryDocument>,
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
  ) {}

  async getPreferences(userId: string) {
    let prefs = await this.prefModel.findOne({ userId });
    if (!prefs) {
      prefs = await this.prefModel.create({
        userId,
        diet: "all",
        allergies: [],
        favoriteCuisines: ["North Indian", "Italian", "Pan-Asian"],
        cookingSkill: "beginner",
        preferredLanguages: ["English"],
        maximumCookingTime: 45,
        spicePreference: "medium",
      });
    }
    return prefs;
  }

  async updatePreferences(userId: string, updateData: Partial<UserPreferences>) {
    const updated = await this.prefModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    return updated;
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findOne({ firebaseUid: userId });
    const preferences = await this.getPreferences(userId);
    const [savedCount, cookedCount, pantryCount] = await Promise.all([
      this.favoriteModel.countDocuments({ userId }),
      this.historyModel.countDocuments({ userId }),
      this.pantryModel.countDocuments({ userId }),
    ]);

    return {
      user: {
        userId: user?.firebaseUid || userId,
        displayName: user?.displayName || "Home Cook",
        email: user?.email,
        avatar: user?.avatar,
        isGuest: user?.isGuest || false,
      },
      preferences,
      stats: {
        savedRecipes: savedCount,
        cookedRecipes: cookedCount,
        pantryItems: pantryCount,
      },
    };
  }
}
