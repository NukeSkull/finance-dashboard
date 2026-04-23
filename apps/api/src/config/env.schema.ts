import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional()
);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().trim().min(1).default("http://localhost:3000"),
  RATE_LIMIT_BYPASS_ORIGINS: z.string().trim().default(
    "http://localhost:3000,http://127.0.0.1:3000"
  ),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_READ_REQUESTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_SENSITIVE_READ_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(30),
  RATE_LIMIT_MAX_WRITE_REQUESTS: z.coerce.number().int().positive().default(10),
  MONGODB_URI: optionalString,
  FIREBASE_PROJECT_ID: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,
  GOOGLE_SHEETS_SPREADSHEET_ID: optionalString,
  GOOGLE_SHEETS_CLIENT_EMAIL: optionalString,
  GOOGLE_SHEETS_PRIVATE_KEY: optionalString
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
}
