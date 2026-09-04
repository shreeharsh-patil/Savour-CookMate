import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserPreferences } from "../../database/schemas/user-preferences.schema";

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
    @Body() preferences: Partial<UserPreferences>
  ) {
    return this.usersService.updatePreferences(user.userId, preferences);
  }

  @Get("users/profile")
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.userId);
  }
}
