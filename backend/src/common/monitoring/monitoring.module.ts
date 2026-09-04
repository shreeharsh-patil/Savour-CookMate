import { Module, Global } from "@nestjs/common";
import { MonitoringService } from "./monitoring.service";
import { MonitoringInterceptor } from "./monitoring.interceptor";

@Global()
@Module({
  providers: [MonitoringService, MonitoringInterceptor],
  exports: [MonitoringService, MonitoringInterceptor],
})
export class MonitoringModule {}
