import * as dns from "dns";
import { z } from "zod";
import * as dotenv from "dotenv";

// Fallback DNS servers to reliably resolve MongoDB Atlas SRV records (_mongodb._tcp)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/savour-cookmate"),
  GEMINI_API_KEY: z.string().optional().default(""),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  USDA_API_KEY: z.string().optional().default("DEMO_KEY"),
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
