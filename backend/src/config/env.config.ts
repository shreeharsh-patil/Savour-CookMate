import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/savour-cookmate"),
  GEMINI_API_KEY: z.string().optional().default(""),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  CORS_ORIGIN: z.string().default("*"),
  SENTRY_DSN: z.string().optional().default(""),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  console.warn("Environment validation warning, applying safe defaults:", error);
  parsedEnv = envSchema.parse({});
}

export const ENV = parsedEnv;
