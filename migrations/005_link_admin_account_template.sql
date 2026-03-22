-- 005_link_admin_account_template.sql
-- Run this after creating an admin user in Supabase Auth.
-- Replace the placeholder UUID/email values before executing.

insert into admin_profiles (id, email, role, display_name, is_active)
values (
  'REPLACE_WITH_AUTH_USER_UUID',
  'REPLACE_WITH_ADMIN_EMAIL',
  'owner',
  'Admin',
  true
)
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();
