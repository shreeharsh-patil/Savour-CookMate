import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import { SearchService, SearchOptions } from "./search.service";
import { FirebaseAuthGuard, Public, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("api/v1/search")
@UseGuards(FirebaseAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Post()
  async search(
    @Body() options: SearchOptions,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.searchService.searchRecipes(options, user?.userId);
  }

  @Public()
  @Get("autocomplete")
  async autocomplete(@Query("q") q?: string) {
    return this.searchService.autocomplete(q || "");
  }
}
