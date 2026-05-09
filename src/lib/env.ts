import { z } from "zod";

const optionalString = z.preprocess((value) => value === '' ? undefined : value, z.string().optional());
const optionalUrl = z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional());
const optionalEmail = z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional());
const optionalFlag = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.enum(["true", "false"]).transform(v => v === "true").optional(),
);

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Resend (optional confirmation emails)
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalEmail,

  // App URLs
  NEXT_PUBLIC_APP_URL: optionalUrl,

  // Internal secrets (optional background/internal APIs)
  INTERNAL_API_SECRET: optionalString,
  CRON_SECRET: optionalString,

  // Sentry (optional in development)
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  SENTRY_ENVIRONMENT: optionalString,
  SENTRY_AUTH_TOKEN: optionalString,

  // Feature flags
  RATE_LIMIT_ENABLED: optionalFlag,
  SENTRY_ENABLED: optionalFlag,
});

type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const env = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,

    // App URLs
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    // Internal secrets
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

    // Feature flags
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
    SENTRY_ENABLED: process.env.SENTRY_ENABLED,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `${key}: ${messages?.join(", ") || "Invalid"}`)
      .join("\n  ");

    const message = `\nEnvironment validation failed:\n  ${errorMessages}`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }

  return result.data as Env;
};

export const env = validateEnv();
