import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

// In-memory rate limiting for expensive AI endpoints: max 10 requests per 5 minutes per user
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const userRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    userRateLimits.set(userId, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new HttpException(
      "AI request limit reached. Please wait a few minutes before trying again.",
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  entry.count += 1;
}

@Controller("api/v1/ai")
@UseGuards(FirebaseAuthGuard)
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post("cook-with-what-i-have")
  async cookWithWhatIHave(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { ingredients: string[]; preferences?: Record<string, any> }
  ) {
    checkRateLimit(user.userId);

    const ingredients = body.ingredients || [];
    if (!Array.isArray(ingredients)) {
      throw new BadRequestException("Ingredients must be an array of strings.");
    }

    if (ingredients.length > 25) {
      throw new BadRequestException("Maximum of 25 ingredients allowed per request.");
    }

    const cleaned = ingredients
      .map((i) => (typeof i === "string" ? i.trim() : ""))
      .filter((i) => i.length > 0);

    for (const ing of cleaned) {
      if (ing.length > 60) {
        throw new BadRequestException(`Ingredient '${ing.slice(0, 20)}...' exceeds maximum length of 60 characters.`);
      }
    }

    return this.geminiService.cookWithWhatIHave(cleaned, body.preferences || {});
  }

  @Post("substitutions")
  async getSubstitutions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { ingredient: string; dishContext?: string }
  ) {
    checkRateLimit(user.userId);

    if (!body.ingredient || typeof body.ingredient !== "string" || body.ingredient.trim().length === 0) {
      throw new BadRequestException("Ingredient name is required.");
    }

    if (body.ingredient.length > 60) {
      throw new BadRequestException("Ingredient name cannot exceed 60 characters.");
    }

    return this.geminiService.getSubstitutions(body.ingredient.trim(), body.dishContext?.slice(0, 100));
  }

  @Post("advice")
  async getAdvice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { question: string; recipeName: string; stepInstruction?: string }
  ) {
    checkRateLimit(user.userId);

    if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
      throw new BadRequestException("Question is required.");
    }

    if (body.question.length > 300) {
      throw new BadRequestException("Question cannot exceed 300 characters.");
    }

    const advice = await this.geminiService.getCookingAdvice(body.question.trim(), {
      name: body.recipeName?.slice(0, 100),
      stepInstruction: body.stepInstruction?.slice(0, 500),
    });
    return { advice };
  }
}
