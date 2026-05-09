import { z } from 'zod'

const optionalString = z.preprocess((value) => value === '' ? undefined : value, z.string().optional())
const optionalUrl = z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional())
const optionalEmail = z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional())
const optionalSentryEnvironment = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.enum(['development', 'staging', 'production']).default('development'),
)
const optionalSentryEnabled = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.enum(['true', 'false']).default('true'),
)

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Resend
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalEmail,
  NEXT_PUBLIC_APP_URL: optionalUrl,

  // API Security
  INTERNAL_API_SECRET: optionalString,
  CRON_SECRET: optionalString,

  // Sentry
  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  SENTRY_AUTH_TOKEN: optionalString,
  SENTRY_ENVIRONMENT: optionalSentryEnvironment,
  SENTRY_ENABLED: optionalSentryEnabled,
  SENTRY_ORG: optionalString,
  SENTRY_PROJECT: optionalString,
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
