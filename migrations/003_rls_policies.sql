-- 003_rls_policies.sql
-- RLS (Row Level Security) policy examples for Supabase
-- Apply these after tables are created and Supabase auth is configured.

-- Enable RLS on tables where needed
alter table if exists golf_courses enable row level security;
alter table if exists booking_policies enable row level security;
alter table if exists source_records enable row level security;
alter table if exists change_logs enable row level security;
alter table if exists user_reports enable row level security;

-- Public / anon role: allow read on verified active golf courses
create policy "anon_can_select_public_courses" on golf_courses
  for select
  using (status = 'active' and verification_status = 'verified');

-- Public: cannot insert/update/delete
create policy "anon_no_mod" on golf_courses
  for all
  to public
  using (false)
  with check (false);

-- Booking policies: public select only when linked course is public and policy is_active
create policy "anon_select_policies" on booking_policies
  for select
  using (is_active = true and exists (select 1 from golf_courses gc where gc.id = booking_policies.golf_course_id and gc.status = 'active' and gc.verification_status = 'verified'));

create policy "anon_no_mod_policies" on booking_policies
  for all
  to public
  using (false)
  with check (false);

-- Admin role (authenticated) policies: allow full access based on admin_profiles role
-- This assumes Supabase auth uid maps to admin_profiles.id
create policy "admin_full_access_golf_courses" on golf_courses
  for all
  to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')));

create policy "admin_full_access_policies" on booking_policies
  for all
  to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')));

-- Source records: admins can insert/update; public cannot select source raw text (sensitive)
create policy "admin_full_access_source" on source_records
  for all
  to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin','editor')))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin','editor')));

create policy "anon_select_source_metadata" on source_records
  for select
  using (is_current = true)
  with check (false);

-- user_reports: allow public to insert reports, admins to manage
create policy "public_insert_reports" on user_reports
  for insert
  to public
  with check (true);

create policy "admin_manage_reports" on user_reports
  for all
  to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')));

-- change_logs: admins only
create policy "admin_change_logs" on change_logs
  for all
  to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid() and ap.is_active = true and ap.role in ('owner','admin')));

-- Notes:
-- - auth.uid() usage assumes Supabase auth where jwt.sub matches admin_profiles.id
-- - Adjust roles and mappings as your Supabase auth setup requires
-- - Test policies thoroughly in Supabase preview environment before production
