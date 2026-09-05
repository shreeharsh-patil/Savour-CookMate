import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const UpdatePreferencesSchema = z.object({
  diet: z.string().max(50).optional(),
  allergies: z.array(z.string().max(50)).max(30).optional(),
  favoriteCuisines: z.array(z.string().max(50)).max(30).optional(),
  cookingSkill: z.string().max(50).optional(),
  preferredLanguages: z.array(z.string().max(50)).max(10).optional(),
  maximumCookingTime: z.number().min(1).max(1440).optional(),
  spicePreference: z.string().max(50).optional(),
});

@Controller("api/v1")
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("preferences")
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getPreferences(user.userId);
  }

  @Put("preferences")
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const preferences = validateRequest(UpdatePreferencesSchema, rawBody);
    return this.usersService.updatePreferences(user.userId, preferences);
  }

  @Get("users/profile")
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Get("users/profile-summary")
  async getProfileSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.userId);
  }
}

