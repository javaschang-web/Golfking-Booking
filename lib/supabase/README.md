# Supabase client initialization

## Files
- `client.ts`: browser/client-side Supabase instance using anon key
- `server.ts`: server-side anon client + service role client factory

## Required env
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Use `createServiceRoleSupabaseClient()` only in server-only code, route handlers, or admin jobs.
