# GitHub Actions: Supabase deploy (instructions)

This repository includes a GitHub Actions workflow to apply Supabase/Postgres migrations and seeds on push to main or via manual dispatch.

Required repository secrets (add in GitHub repository Settings → Secrets → Actions):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL  (postgres connection string used for verification step, e.g. postgresql://postgres:PASSWORD@db.uuvzjaqbvpolqhxkqjzw.supabase.co:5432/postgres)

How it works:
- The workflow uses the Supabase CLI Docker image (ghcr.io/supabase/cli:latest) to run `db push` for each migration file under golfking-booking/migrations.
- After migrations/seeds, it installs `psql` and runs a quick verification query against DATABASE_URL.

Run manually:
- Go to Actions -> Deploy Supabase Migrations -> Run workflow (choose main branch)

Security notes:
- Store keys in GitHub Secrets, not in repository files.
- Rotate the Service Role Key after initial run if you previously exposed it elsewhere.

If the workflow fails:
- Copy the step logs and paste here; I'll inspect and suggest fixes.
