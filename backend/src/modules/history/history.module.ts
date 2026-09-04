import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { HistoryService } from "./history.service";
import { HistoryController } from "./history.controller";
import { FirebaseAuthGuard } from "../../common/guards/firebase-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [HistoryController],
  providers: [HistoryService, FirebaseAuthGuard],
  exports: [HistoryService],
})
export class HistoryModule {}
