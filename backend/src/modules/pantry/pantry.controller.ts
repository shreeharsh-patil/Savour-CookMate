import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { PantryService, CreatePantryItemDto, UpdatePantryItemDto } from "./pantry.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const CreatePantryItemSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty").max(100, "Ingredient name cannot exceed 100 characters"),
  quantity: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  expiryDate: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  lowStock: z.boolean().optional(),
});

const UpdatePantryItemSchema = z.object({
  quantity: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  expiryDate: z.string().max(50).optional(),
  lowStock: z.boolean().optional(),
});

const FindDishesSchema = z.object({
  ingredients: z.array(z.string().max(100)).max(50).optional(),
  includeAi: z.boolean().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

@Controller("api/v1/pantry")
@UseGuards(FirebaseAuthGuard)
export class PantryController {
  constructor(private readonly pantryService: PantryService) {}

  @Get()
  async getPantry(@CurrentUser() user: AuthenticatedUser) {
    return this.pantryService.getPantryItems(user.userId);
  }

  @Post()
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const dto = validateRequest(CreatePantryItemSchema, rawBody);
    return this.pantryService.addItem(user.userId, dto);
  }

  @Put(":id")
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() rawBody: unknown
  ) {
    const dto = validateRequest(UpdatePantryItemSchema, rawBody);
    return this.pantryService.updateItem(user.userId, id, dto);
  }

  @Delete(":id")
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.pantryService.removeItem(user.userId, id);
  }

  @Get("smart-sections")
  async getSmartSections(@CurrentUser() user: AuthenticatedUser) {
    return this.pantryService.getSmartSections(user.userId);
  }

  @Post("find-dishes")
  async findDishes(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const body = validateRequest(FindDishesSchema, rawBody);
    return this.pantryService.findDishesICanMake(
      user.userId,
      body.ingredients,
      body.includeAi === true,
      body.preferences
    );
  }
}
