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
  // Preserve the existing local database default so a rebrand cannot split user data.
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/savour-cookmate"),
  GEMINI_API_KEY: z.string().optional().default(""),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  INVIDIOUS_INSTANCES: z
    .string()
    .optional()
    .default("https://inv.nadeko.net,https://invidious.nerdvpn.de,https://yewtu.be,https://invidious.projectsegfau.lt"),
  USDA_API_KEY: z.string().optional().default("DEMO_KEY"),
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  CORS_ORIGIN: z.string().default("*"),
  SENTRY_DSN: z.string().optional().default(""),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

import * as fs from "fs";
import * as path from "path";

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: Environment validation failed in production:", error);
    throw error;
  }
  console.warn("Environment validation warning, applying safe defaults:", error);
  parsedEnv = envSchema.parse({});
}

// Fail startup in production when mandatory configuration is missing or invalid
if (parsedEnv.NODE_ENV === "production") {
  const missing: string[] = [];
  if (
    !parsedEnv.MONGODB_URI ||
    parsedEnv.MONGODB_URI.includes("127.0.0.1") ||
    parsedEnv.MONGODB_URI.includes("localhost")
  ) {
    missing.push("Production MONGODB_URI (must be non-local)");
  }

  const hasFirebaseCredentials =
    Boolean(
      parsedEnv.FIREBASE_PROJECT_ID &&
        parsedEnv.FIREBASE_CLIENT_EMAIL &&
        parsedEnv.FIREBASE_PRIVATE_KEY
    ) ||
    fs.existsSync(path.resolve(process.cwd(), "serviceAccountKey.json")) ||
    fs.existsSync(path.resolve(process.cwd(), "backend", "serviceAccountKey.json"));

  if (!hasFirebaseCredentials) {
    missing.push("Firebase Admin credentials (credentials or serviceAccountKey.json)");
  }

  if (missing.length > 0) {
    const fatalMsg = `FATAL: Production environment validation failed:\n - ${missing.join("\n - ")}`;
    console.error(fatalMsg);
    throw new Error(fatalMsg);
  }
}

export const ENV = parsedEnv;
