import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../../database/schemas/user.schema";
import { UserPreferences, UserPreferencesDocument } from "../../database/schemas/user-preferences.schema";
import { AuthenticatedUser } from "../../common/guards/firebase-auth.guard";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserPreferences.name) private prefModel: Model<UserPreferencesDocument>,
  ) {}

  async syncUser(authUser: AuthenticatedUser) {
    let user = await this.userModel.findOne({ firebaseUid: authUser.userId });

    if (!user) {
      user = await this.userModel.create({
        firebaseUid: authUser.userId,
        email: authUser.email,
        displayName: authUser.displayName || "Home Cook",
        avatar: authUser.avatar,
        isGuest: authUser.isGuest,
      });

      // Initialize default preferences
      await this.prefModel.findOneAndUpdate(
        { userId: authUser.userId },
        {
          userId: authUser.userId,
          diet: "all",
          allergies: [],
          favoriteCuisines: ["North Indian", "Italian", "Pan-Asian"],
          cookingSkill: "beginner",
          preferredLanguages: ["English"],
          maximumCookingTime: 45,
          spicePreference: "medium",
        },
        { upsert: true, new: true }
      );
    } else {
      // Update metadata if changed
      if (authUser.displayName && user.displayName !== authUser.displayName) {
        user.displayName = authUser.displayName;
      }
      if (authUser.avatar && user.avatar !== authUser.avatar) {
        user.avatar = authUser.avatar;
      }
      await user.save();
    }

    const preferences = await this.prefModel.findOne({ userId: authUser.userId });

    return {
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        isGuest: user.isGuest,
      },
      preferences,
    };
  }

  async getMe(authUser: AuthenticatedUser) {
    return this.syncUser(authUser);
  }
}
