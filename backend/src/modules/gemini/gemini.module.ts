import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { GeminiService } from "./gemini.service";
import { GeminiController } from "./gemini.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [GeminiController],
  providers: [GeminiService, FirebaseAuthGuard],
  exports: [GeminiService],
})
export class GeminiModule {}
