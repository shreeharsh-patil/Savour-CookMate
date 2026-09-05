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

import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

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

const CookWithWhatIHaveSchema = z.object({
  ingredients: z.array(z.string().min(1).max(60)).min(1, "At least one ingredient required").max(25, "Maximum 25 ingredients allowed"),
  preferences: z.record(z.string(), z.any()).optional(),
});

const SubstitutionsSchema = z.object({
  ingredient: z.string().min(1, "Ingredient is required").max(60, "Ingredient cannot exceed 60 characters"),
  dishContext: z.string().max(100).optional(),
});

const AdviceSchema = z.object({
  question: z.string().min(1, "Question is required").max(300, "Question cannot exceed 300 characters"),
  recipeName: z.string().max(100).optional().default(""),
  stepInstruction: z.string().max(500).optional(),
});

@Controller("api/v1/ai")
@UseGuards(FirebaseAuthGuard)
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post("cook-with-what-i-have")
  async cookWithWhatIHave(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    checkRateLimit(user.userId);
    const body = validateRequest(CookWithWhatIHaveSchema, rawBody);
    return this.geminiService.cookWithWhatIHave(body.ingredients, body.preferences || {});
  }

  @Post("substitutions")
  async getSubstitutions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    checkRateLimit(user.userId);
    const body = validateRequest(SubstitutionsSchema, rawBody);
    return this.geminiService.getSubstitutions(body.ingredient.trim(), body.dishContext);
  }

  @Post("advice")
  async getAdvice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    checkRateLimit(user.userId);
    const body = validateRequest(AdviceSchema, rawBody);
    const advice = await this.geminiService.getCookingAdvice(body.question.trim(), {
      name: body.recipeName,
      stepInstruction: body.stepInstruction,
    });
    return { advice };
  }
}
