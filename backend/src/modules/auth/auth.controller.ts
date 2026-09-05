import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FirebaseAuthGuard, Public, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import * as crypto from "crypto";

@Controller("api/v1/auth")
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("verify")
  async verifySession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.syncUser(user);
  }

  @Get("me")
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user);
  }

  @Public()
  @Post("guest")
  async createGuestSession() {
    const guestId = `guest_${crypto.randomBytes(8).toString("hex")}`;
    const guestUser: AuthenticatedUser = {
      userId: guestId,
      displayName: "Guest",
      isGuest: true,
    };
    const synced = await this.authService.syncUser(guestUser);
    return {
      token: guestId,
      ...synced,
    };
  }
}
