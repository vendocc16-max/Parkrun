This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup for Wave 3 Hardening

This project uses a centralized environment validation system with Zod to ensure all required services are properly configured.

### Required Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the following services:

#### Core Services
- **Supabase** (PostgreSQL & Auth)
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
  - [Setup Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

- **Resend** (Email Service)
  - `RESEND_API_KEY`: Your Resend API key
  - `RESEND_FROM_EMAIL`: Sender email address
  - [Setup Guide](https://resend.com/docs/send-with-nextjs)

#### Rate Limiting & Security
- **Upstash Redis** (Rate Limiting)
  - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
  - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis token
  - [Setup Guide](https://upstash.com/docs/redis/features/rest-api)

- **Turnstile** (CAPTCHA)
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site key
  - `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key
  - [Setup Guide](https://developers.cloudflare.com/turnstile/)

#### Monitoring & Observability
- **Sentry** (Error Tracking)
  - `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN
  - `SENTRY_ENVIRONMENT`: Environment (development, staging, production)
  - `SENTRY_AUTH_TOKEN`: Sentry authentication token (for source maps upload)
  - [Setup Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

#### Feature Flags
- `RATE_LIMIT_ENABLED`: Enable rate limiting (true/false)
- `CAPTCHA_ENABLED`: Enable CAPTCHA verification (true/false)
- `SENTRY_ENABLED`: Enable Sentry error tracking (true/false)

### Environment Validation

The application validates all environment variables at runtime using Zod schema defined in `src/lib/env.ts`. 

- **Development**: Missing optional variables trigger warnings in console
- **Production**: Missing required variables cause the build to fail

To validate manually:
```bash
npm run build
```

### Development Setup

1. Copy environment template:
```bash
cp .env.local.example .env.local
```

2. Fill in placeholder values with your service credentials

3. Run development server:
```bash
npm run dev
```

The app will warn about missing optional services, but will run with rate limiting, CAPTCHA, and Sentry disabled.


