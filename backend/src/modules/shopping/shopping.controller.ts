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
import { ShoppingService } from "./shopping.service";
import { FirebaseAuthGuard, AuthenticatedUser } from "../../common/guards/firebase-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { z } from "zod";
import { validateRequest } from "../../common/validation/validate-request";

const AddShoppingItemSchema = z.object({
  name: z.string().min(1, "Item name cannot be empty").max(100, "Item name cannot exceed 100 characters"),
  quantity: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  recipeId: z.string().max(100).optional(),
});

const AddMissingSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID cannot be empty").max(100),
});

@Controller("api/v1/shopping-list")
@UseGuards(FirebaseAuthGuard)
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Get()
  async getList(@CurrentUser() user: AuthenticatedUser) {
    return this.shoppingService.getList(user.userId);
  }

  @Post()
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const body = validateRequest(AddShoppingItemSchema, rawBody);
    return this.shoppingService.addItem(
      user.userId,
      body.name,
      body.quantity,
      body.unit,
      body.category,
      body.recipeId
    );
  }

  @Put(":id/toggle")
  async toggleChecked(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.shoppingService.toggleChecked(user.userId, id);
  }

  @Delete(":id")
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.shoppingService.removeItem(user.userId, id);
  }

  @Delete("clear-checked")
  async clearChecked(@CurrentUser() user: AuthenticatedUser) {
    return this.shoppingService.clearChecked(user.userId);
  }

  @Post("add-missing")
  async addMissingFromRecipe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() rawBody: unknown
  ) {
    const body = validateRequest(AddMissingSchema, rawBody);
    return this.shoppingService.addMissingFromRecipe(user.userId, body.recipeId);
  }

  @Post("move-to-pantry")
  async moveCheckedToPantry(@CurrentUser() user: AuthenticatedUser) {
    return this.shoppingService.moveCheckedToPantry(user.userId);
  }
}
