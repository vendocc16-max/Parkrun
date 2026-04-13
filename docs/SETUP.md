# Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Use `nvm` or `fnm` to manage versions |
| Supabase CLI | latest | `npm install -g supabase` |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Resend account | — | Verified sending domain required before going live |
| Vercel account | — | For hosting and cron jobs |

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/parkrun.git
cd parkrun

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Open .env.local and fill in all required values (see .env.local.example for descriptions)

# 4. Install Supabase CLI (if not already installed)
npm install -g supabase

# 5. Authenticate with Supabase
supabase login

# 6. Link to your Supabase project
supabase link --project-ref <your-project-ref>
# The project ref is the string in your Supabase dashboard URL:
# https://supabase.com/dashboard/project/<project-ref>

# 7. Apply all migrations to the linked database
supabase db push

# 8. Reset local database (runs migrations + seed data)
supabase db reset

# 9. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only, never expose to client

# Resend (email)
RESEND_API_KEY=re_<key>
RESEND_FROM_ADDRESS=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000      # change to production URL in prod

# Sentry (optional but recommended)
SENTRY_DSN=https://<key>@sentry.io/<project>
```

---

## Email Deliverability Checklist

Complete all of these before sending any real emails.

- [ ] **SPF** — Add a TXT record to your sending domain's DNS:
  ```
  v=spf1 include:resend.com ~all
  ```
- [ ] **DKIM** — In the Resend dashboard, go to *Domains → your domain → DKIM*. Copy the CNAME record provided and add it to DNS. Wait for Resend to confirm verification (can take up to 48 hours).
- [ ] **DMARC** — Add a TXT record at `_dmarc.yourdomain.com`:
  ```
  v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
  ```
  Start with `p=none` (monitoring mode). Move to `p=quarantine` or `p=reject` once you confirm legitimate mail is not being affected.
- [ ] **Verify sender domain** in Resend dashboard before going live. Resend will reject sends from unverified domains.

---

## Supabase Environment Separation

Create three separate Supabase projects:

| Project name | Purpose |
|---|---|
| `parkrun-dev` | Local development and feature testing |
| `parkrun-staging` | Pre-production, used for QA and stakeholder review |
| `parkrun-prod` | Production |

Use separate env files for each:

```
.env.local        → parkrun-dev
.env.staging      → parkrun-staging
.env.production   → parkrun-prod
```

**Rules:**
- Never use the production `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- Never run `supabase db reset` against staging or production — it wipes and re-seeds the database.
- Apply migrations to staging/prod with `supabase db push --linked` after linking to the correct project.
- To switch linked project: `supabase link --project-ref <new-ref>`.

---

## Vercel Deployment

1. Push the repository to GitHub.
2. In the [Vercel dashboard](https://vercel.com/), click *Add New → Project* and import the GitHub repository.
3. Under *Settings → Environment Variables*, add every variable from `.env.local.example` with production values.
   - Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://parkrun.yourdomain.com`).
   - Scope `SUPABASE_SERVICE_ROLE_KEY` to *Production* only — do not add it to Preview deployments.
4. Cron jobs are configured in `vercel.json` and run automatically once the project is deployed. Vercel Cron requires a Pro plan or above. Verify cron jobs are active under *Settings → Crons* after first deploy.

---

## Monitoring Setup

### Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard will create `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. Add the DSN to your environment:

```
SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=<your-project-slug>
```

Set `SENTRY_DSN` in Vercel environment variables for production error tracking. For local dev, it can be left unset — Sentry will be a no-op.
