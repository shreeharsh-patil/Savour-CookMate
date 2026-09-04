import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, FirebaseAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
