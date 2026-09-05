import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import { SearchService } from "./search.service";
import { FirebaseAuthGuard, Public, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const SearchOptionsSchema = z.object({
  query: z.string().max(100).default(""),
  cuisine: z.string().max(50).optional(),
  mealType: z.string().max(50).optional(),
  diet: z.string().max(50).optional(),
  maxCookingTime: z.number().min(0).max(1440).optional(),
  spicePreference: z.string().max(50).optional(),
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(50).default(20).optional(),
});

const AutocompleteQuerySchema = z.object({
  q: z.string().max(100).optional().default(""),
});

@Controller("api/v1/search")
@UseGuards(FirebaseAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Post()
  async search(
    @Body() rawBody: unknown,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const options = validateRequest(SearchOptionsSchema, rawBody);
    return this.searchService.searchRecipes(options, user?.userId);
  }

  @Public()
  @Get("autocomplete")
  async autocomplete(@Query() query: unknown) {
    const { q } = validateRequest(AutocompleteQuerySchema, query);
    return this.searchService.autocomplete(q || "");
  }
}

