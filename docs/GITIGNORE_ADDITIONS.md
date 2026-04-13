# .gitignore Additions Required

The Next.js project has not been scaffolded yet. Once `npm create next-app` (or equivalent) has run, ensure the generated `.gitignore` includes the following entries. Add any that are missing.

## Environment files
```
.env.local
.env.staging
.env.production
```
These files hold secrets (Supabase service role keys, Resend API keys, etc.) and must never be committed. The repository should include only `.env.local.example` with placeholder values and descriptions.

## Supabase CLI artefacts
```
supabase/.branches
supabase/.temp
```
`supabase/.branches` holds local branch state used by the Supabase CLI and is machine-specific. `supabase/.temp` holds temporary migration and diff files generated during `supabase db diff` and similar commands.

## Standard Next.js entries (confirm these are present)
```
.next/
out/
node_modules/
```

Once the scaffold is in place, run a quick check:
```bash
grep -E '\.env\.(local|staging|production)' .gitignore
grep -E 'supabase/\.(branches|temp)' .gitignore
```
Both greps should return matches. If not, add the missing lines.
