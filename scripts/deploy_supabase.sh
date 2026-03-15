#!/usr/bin/env bash
# deploy_supabase.sh
# Apply migrations and seed to Supabase/Postgres using psql or supabase CLI
# Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ./deploy_supabase.sh

set -e

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  exit 1
fi

# Option A: Using supabase CLI (if installed)
if command -v supabase >/dev/null 2>&1; then
  echo "Detected supabase CLI. Running migration push..."
  supabase db remote set --project-ref "$SUPABASE_URL" || true
  supabase db push --file migrations/001_init.sql
  supabase db push --file migrations/002_seed_sample.sql
  supabase db push --file migrations/003_rls_policies.sql
  echo "Migrations pushed via supabase CLI."
  exit 0
fi

# Option B: Using psql (requires a full DATABASE_URL with service role privileges)
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set. If you don't have supabase CLI, set DATABASE_URL to psql connection string."
  exit 1
fi

echo "Applying migrations via psql..."
psql "$DATABASE_URL" -f migrations/001_init.sql
psql "$DATABASE_URL" -f migrations/002_seed_sample.sql
psql "$DATABASE_URL" -f migrations/003_rls_policies.sql

echo "Done."
