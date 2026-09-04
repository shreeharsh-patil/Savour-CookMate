import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { FastifyRequest, FastifyReply } from "fastify";
import { MonitoringService } from "./monitoring.service";

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const res = http.getResponse<FastifyReply>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const path = (req as any).routeOptions?.url || (req as any).routerPath || req.url || "unknown";
          const statusCode = res.statusCode || 200;
          this.monitoringService.recordRequest(req.method, path, statusCode, duration);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const path = (req as any).routeOptions?.url || (req as any).routerPath || req.url || "unknown";
          const statusCode = err.status || err.statusCode || 500;
          this.monitoringService.recordRequest(req.method, path, statusCode, duration);
          this.monitoringService.logError(`Request failed: ${req.method} ${path}`, err, {
            path,
            method: req.method,
            statusCode,
          });
        },
      })
    );
  }
}
