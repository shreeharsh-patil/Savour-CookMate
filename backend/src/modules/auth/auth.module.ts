import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
