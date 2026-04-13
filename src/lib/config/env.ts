import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Resend
  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // API Security
  INTERNAL_API_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),

  // Sentry
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  SENTRY_ENABLED: z.enum(['true', 'false']).default('true'),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  const env = Object.entries(process.env).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) acc[key] = value
      return acc
    },
    {} as Record<string, string>,
  )

  const result = envSchema.safeParse(env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    })
    throw new Error('Invalid environment variables')
  }

  return result.data
}

export const env = validateEnv()
