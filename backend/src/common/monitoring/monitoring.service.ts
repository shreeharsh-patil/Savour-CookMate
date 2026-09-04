import { Injectable, Logger } from "@nestjs/common";

interface RouteMetric {
  path: string;
  method: string;
  count: number;
  totalDurationMs: number;
  errors: number;
  latencies: number[]; // circular/sampled for p95
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger("MonitoringService");
  private readonly metrics = new Map<string, RouteMetric>();
  private totalRequests = 0;
  private totalErrors = 0;
  private readonly startTime = Date.now();

  // Keys that must be redacted from any logs or telemetry
  private readonly SENSITIVE_KEYS = new Set([
    "password",
    "pass",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "cookie",
    "secret",
    "apikey",
    "privatekey",
  ]);

  /**
   * Redacts sensitive data from objects, nested maps, or headers
   */
  public sanitize<T>(data: T): T {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as unknown as T;
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  /**
   * Log an operational or system error securely without secret leaks
   */
  public logError(
    message: string,
    error?: unknown,
    context?: Record<string, any>
  ): void {
    this.totalErrors++;
    const sanitizedContext = context ? this.sanitize(context) : {};

    let errorMessage = message;
    let stack: string | undefined;

    if (error instanceof Error) {
      errorMessage = `${message}: ${error.message}`;
      stack = error.stack;
    } else if (typeof error === "string") {
      errorMessage = `${message}: ${error}`;
    }

    this.logger.error(
      `${errorMessage} | Context: ${JSON.stringify(sanitizedContext)}`,
      stack
    );
  }

  /**
   * Track request duration and status for endpoint metrics
   */
  public recordRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ): void {
    this.totalRequests++;
    const key = `${method.toUpperCase()} ${path}`;

    let metric = this.metrics.get(key);
    if (!metric) {
      metric = {
        path,
        method: method.toUpperCase(),
        count: 0,
        totalDurationMs: 0,
        errors: 0,
        latencies: [],
      };
      this.metrics.set(key, metric);
    }

    metric.count++;
    metric.totalDurationMs += durationMs;

    if (statusCode >= 400) {
      metric.errors++;
      if (statusCode >= 500) {
        this.totalErrors++;
      }
    }

    // Keep last 100 latency samples for calculating p95
    if (metric.latencies.length >= 100) {
      metric.latencies.shift();
    }
    metric.latencies.push(durationMs);
  }

  /**
   * Returns a snapshot of system performance metrics
   */
  public getMetricsSummary() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const routesSummary: Array<{
      route: string;
      calls: number;
      avgDurationMs: number;
      p95DurationMs: number;
      errorRate: string;
    }> = [];

    for (const [route, metric] of this.metrics.entries()) {
      const avgDuration =
        metric.count > 0 ? Math.round(metric.totalDurationMs / metric.count) : 0;

      const sorted = [...metric.latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted.length > 0 ? sorted[p95Index] : 0;
      const errorRate =
        metric.count > 0
          ? `${((metric.errors / metric.count) * 100).toFixed(1)}%`
          : "0%";

      routesSummary.push({
        route,
        calls: metric.count,
        avgDurationMs: avgDuration,
        p95DurationMs: Math.round(p95),
        errorRate,
      });
    }

    return {
      uptimeSeconds,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      activeRoutesTracked: this.metrics.size,
      routes: routesSummary,
    };
  }
}
