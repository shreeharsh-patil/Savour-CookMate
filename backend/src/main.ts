import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module";
import { ENV } from "./config/env.config";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  // Security: Helmet for HTTP header protection
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  // Security: CORS configuration
  await app.register(fastifyCors as any, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Security: Rate limiting (e.g., 200 requests per minute per IP)
  await app.register(fastifyRateLimit as any, {
    max: 200,
    timeWindow: "1 minute",
  });

  // Global structured exception handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Health check endpoint for Cloud Run and Kubernetes
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get("/api/health", async (req, reply) => {
    return {
      status: "ok",
      service: "savour-cookmate-backend",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      database: "MongoDB Atlas",
    };
  });

  await app.listen(ENV.PORT, "0.0.0.0");
  console.log(`\n======================================================`);
  console.log(`  Savour CookMate NestJS API Server (Fastify + MongoDB) `);
  console.log(`  Running on: http://localhost:${ENV.PORT}             `);
  console.log(`  Health check: http://localhost:${ENV.PORT}/api/health `);
  console.log(`======================================================\n`);
}

bootstrap().catch((err) => {
  console.error("Critical server bootstrap error:", err);
  process.exit(1);
});
