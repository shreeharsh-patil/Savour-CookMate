import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { FirebaseAuthGuard, Public } from "../../common/guards/firebase-auth.guard";

@Controller("api/v1/ai")
@UseGuards(FirebaseAuthGuard)
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Public()
  @Post("cook-with-what-i-have")
  async cookWithWhatIHave(
    @Body() body: { ingredients: string[]; preferences?: Record<string, any> }
  ) {
    return this.geminiService.cookWithWhatIHave(body.ingredients || [], body.preferences || {});
  }

  @Public()
  @Post("substitutions")
  async getSubstitutions(
    @Body() body: { ingredient: string; dishContext?: string }
  ) {
    return this.geminiService.getSubstitutions(body.ingredient, body.dishContext);
  }

  @Public()
  @Post("advice")
  async getAdvice(
    @Body() body: { question: string; recipeName: string; stepInstruction?: string }
  ) {
    const advice = await this.geminiService.getCookingAdvice(body.question, {
      name: body.recipeName,
      stepInstruction: body.stepInstruction,
    });
    return { advice };
  }
}
