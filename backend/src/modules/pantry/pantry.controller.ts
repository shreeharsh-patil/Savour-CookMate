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
    @Body() dto: CreatePantryItemDto
  ) {
    return this.pantryService.addItem(user.userId, dto);
  }

  @Put(":id")
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdatePantryItemDto
  ) {
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
}
