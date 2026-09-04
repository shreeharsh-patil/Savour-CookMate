import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { GeminiModule } from "../gemini/gemini.module";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule, GeminiModule],
  controllers: [SearchController],
  providers: [SearchService, FirebaseAuthGuard],
  exports: [SearchService],
})
export class SearchModule {}
