import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Resend
  RESEND_API_KEY: z.string().min(1, "Resend API key is required"),
  RESEND_FROM_EMAIL: z.string().email("Invalid Resend from email"),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL"),

  // Internal secrets
  INTERNAL_API_SECRET: z.string().min(1, "Internal API secret is required"),
  CRON_SECRET: z.string().min(1, "Cron secret is required"),

  // Upstash Redis (optional in development)
  UPSTASH_REDIS_REST_URL: z.string().url("Invalid Upstash Redis URL").optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Turnstile (optional in development)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Sentry (optional in development)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Feature flags
  RATE_LIMIT_ENABLED: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  CAPTCHA_ENABLED: z.enum(["true", "false"]).transform(v => v === "true").optional(),
  SENTRY_ENABLED: z.enum(["true", "false"]).transform(v => v === "true").optional(),
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

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    // Turnstile
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,

    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,

    // Feature flags
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
    CAPTCHA_ENABLED: process.env.CAPTCHA_ENABLED,
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
