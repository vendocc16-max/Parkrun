@AGENTS.md

# Parkrun Anmälan — Codebase Guide

## Project Overview

A Swedish Parkrun event registration platform. The public side lets participants register for Parkrun sessions (with capacity management and waitlists). The admin side lets organizers manage sessions, view registrations, and send bulk emails.

**Language note:** All user-facing UI text is in Swedish. Keep new UI strings in Swedish.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router only) |
| Runtime | React 19.2.4 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Database / Auth | Supabase (PostgreSQL + Row-Level Security) |
| Email | Resend |
| Rate Limiting | Upstash Redis |
| CAPTCHA | Cloudflare Turnstile |
| Error Tracking | Sentry |
| Validation | Zod v4 |
| Forms | react-hook-form v7 |
| Deployment | Vercel |

---

## Development Commands

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint (flat config, Next.js + TS rules)
```

There is no test runner script in `package.json`. Tests in `src/lib/__tests__/` use Jest syntax but no Jest config file exists — verify before running tests.

---

## Directory Structure

```
src/
├── app/                        # App Router pages and API routes
│   ├── layout.tsx              # Root layout (fonts, nav, footer, Sentry init)
│   ├── globals.css             # Tailwind base + CSS custom properties
│   ├── page.tsx                # Home / landing page
│   ├── sessions/               # Public session browsing & registration
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── register/
│   │           ├── page.tsx
│   │           └── success/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── admin/                  # Protected organizer dashboard
│   │   ├── layout.tsx          # Auth guard — redirects to /auth/login
│   │   ├── page.tsx            # Dashboard
│   │   ├── sessions/
│   │   ├── registrations/
│   │   ├── messages/
│   │   └── settings/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts      # Server action: Supabase signIn
│   │   └── logout/route.ts     # Route handler: Supabase signOut
│   └── api/
│       ├── registrations/route.ts      # POST — core registration endpoint
│       ├── email/
│       │   ├── confirmation/route.ts   # POST — internal, send confirmation email
│       │   └── send-reminder/route.ts  # POST — organizer, bulk reminder emails
│       └── admin/sessions/[id]/export/route.ts
├── components/
│   └── TurnstileWidget.tsx     # Cloudflare Turnstile CAPTCHA widget
├── lib/
│   ├── env.ts                  # Zod-validated env (import `env` from here)
│   ├── captcha.ts              # Turnstile server-side verification
│   ├── rate-limit.ts           # Upstash Redis rate limiting
│   ├── sentry.ts               # Server-side Sentry helpers
│   ├── sentry-client.ts        # Client-side Sentry init component
│   ├── config/
│   │   ├── env.ts
│   │   └── rules.ts            # Business rules (capacity, waitlist, etc.)
│   ├── email/
│   │   ├── resend.ts           # Resend client
│   │   ├── send.ts             # Bulk send helpers
│   │   ├── sendConfirmation.ts # Registration confirmation
│   │   └── templates/         # React Email templates (TSX)
│   ├── supabase/
│   │   ├── client.ts           # Browser client (public anon key)
│   │   ├── server.ts           # Server client (cookie-managed session)
│   │   ├── admin.ts            # Admin client (service role — server only)
│   │   └── middleware.ts       # updateSession() — protects /admin routes
│   ├── validations/
│   │   └── registration.ts     # Zod schemas for registration form
│   └── __tests__/
│       └── rate-limit.test.ts
├── instrumentation.ts          # Sentry server init (Next.js instrumentation hook)
└── proxy.ts
supabase/
├── migrations/
│   ├── 001_initial_schema.sql  # All tables
│   ├── 002_rls_policies.sql    # Row-Level Security
│   └── 003_functions.sql       # Postgres functions
├── types.ts                    # Auto-generated Supabase TS types
└── seed.sql
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local`. All variables are validated at startup via `src/lib/env.ts` — import `env` from there instead of `process.env` directly.

**Required for all environments:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
INTERNAL_API_SECRET
CRON_SECRET
```

**Optional (feature-flagged, disabled locally by default):**
```
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   # Rate limiting
NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY  # CAPTCHA
NEXT_PUBLIC_SENTRY_DSN / SENTRY_AUTH_TOKEN           # Error tracking

# Feature flags (string "true"/"false"):
RATE_LIMIT_ENABLED    # default: disabled
CAPTCHA_ENABLED       # default: enabled
SENTRY_ENABLED        # default: enabled
```

---

## Architecture & Key Conventions

### Supabase Client Usage

Use the correct client for the context — never use the admin client in browser code:

| Context | Client | File |
|---|---|---|
| Browser (Client Components) | `createBrowserClient` | `@/lib/supabase/client.ts` |
| Server Components / Route Handlers / Server Actions | `createServerClient` | `@/lib/supabase/server.ts` |
| Admin API routes (bypass RLS) | `createClient` (service role) | `@/lib/supabase/admin.ts` |

### Route Protection

`/admin/*` is protected by the auth guard in `src/app/admin/layout.tsx`, which calls `updateSession()` from `@/lib/supabase/middleware.ts`. There is **no root-level `middleware.ts`** — the guard is layout-based.

### API Route Security

Internal API routes (e.g. `/api/email/confirmation`) require the `x-internal-secret` header matching `INTERNAL_API_SECRET`. Never call these directly from the browser.

The registration endpoint (`/api/registrations`) applies, in order:
1. Zod schema validation
2. Rate limiting (IP: 10 req/60s, email: 5 req/60s) — if `RATE_LIMIT_ENABLED`
3. CAPTCHA verification — if `CAPTCHA_ENABLED`
4. Session capacity / waitlist logic
5. Duplicate detection
6. Database writes (guardian upsert → participant → registration → consent)
7. Fire-and-forget confirmation email (does not block response)

### Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `sessions` | Parkrun events with capacity, waitlist toggle, dates |
| `guardians` | Parent/guardian contact info (upserted on registration) |
| `participants` | Individual runners with age/medical info |
| `registrations` | Links participant ↔ session; status: `confirmed`, `waitlisted`, `cancelled`, `duplicate_flagged`, `blocked` |
| `consents` | Terms/privacy consent per registration |
| `organizers` / `organizer_roles` | Organizer accounts with roles: `owner`, `admin`, `editor`, `messaging_only` |
| `outbound_messages` / `message_deliveries` | Email audit trail |
| `rate_limit_events` | Rate limit audit log |

Use `supabase/types.ts` for TypeScript types — do not write manual table types.

Postgres helper functions (called via `rpc()`):
- `get_session_confirmed_count(session_id)` — avoids counting rows client-side
- `get_next_waitlist_position(session_id)` — atomic waitlist positioning

### Styling Conventions

Tailwind CSS 4. Use the semantic CSS custom properties defined in `globals.css`, not raw hex values:

| Variable | Usage |
|---|---|
| `bg-park-dark` / `text-park-dark` | `#141c14` — dark green, primary text |
| `bg-park-green` | `#1d5c3e` — primary brand green |
| `bg-park-lime` / `text-park-lime` | `#c6e832` — accent / highlights |
| `bg-park-cream` | `#f5f1ea` — page background |
| `text-park-muted` | `#5c6b5e` — secondary text |
| `border-park-border` | `#ddd8cc` — borders and dividers |

Fonts (set as CSS variables on `<html>`):
- `font-display` → Barlow Condensed (headings, nav, labels)
- `font-body` (default) → DM Sans (body text, forms)

### Path Aliases

`@/*` maps to `src/*`. Always use this alias for imports within the project.

---

## Sentry Integration

- Server-side: initialized in `src/instrumentation.ts` (Next.js instrumentation hook)
- Client-side: `<SentryClientInit />` component mounted in root layout
- Wrap server errors with `Sentry.captureException()` from `@/lib/sentry`
- Sample rates: `1.0` in development, `0.1` in production

---

## Email Templates

Templates live in `src/lib/email/templates/` as React TSX components (React Email format). There are four templates:
- `confirmation.tsx` — sent after successful registration
- `cancellation.tsx` — sent on cancellation
- `reminder.tsx` — bulk reminder sent by organizers
- `waitlist-promotion.tsx` — sent when a waitlisted participant gets a spot

---

## Important Caveats

- **Next.js 16 has breaking changes** from earlier versions. Before modifying framework-level code (routing, data fetching, middleware, caching), check `AGENTS.md` and consult `node_modules/next/dist/docs/` if it exists.
- **Zod v4** has API differences from v3 (e.g. `.coerce`, `.brand`, error map changes). Check docs before using unfamiliar Zod APIs.
- **No CI/CD pipeline** is configured. There are no GitHub Actions workflows. Testing and linting must be run locally.
- **No Prettier config** — ESLint handles formatting. Run `npm run lint` before committing.
- The `vercel.json` is intentionally empty — all configuration is handled via the Vercel dashboard or environment variables.
