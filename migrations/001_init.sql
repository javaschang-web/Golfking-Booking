-- 001_init.sql
-- Supabase/Postgres initial migration for GolfKing Booking MVP

-- Enable uuid extension
create extension if not exists "pgcrypto";

-- Table: admin_profiles
create table if not exists admin_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'viewer',
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: golf_courses
create table if not exists golf_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  english_name text,
  region_primary text not null,
  region_secondary text,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  homepage_url text,
  booking_url text,
  map_url text,
  membership_required boolean not null default false,
  membership_note text,
  cancellation_policy_summary text,
  booking_note text,
  status text not null default 'active',
  verification_status text not null default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists idx_golf_courses_region on golf_courses(region_primary);
create index if not exists idx_golf_courses_status_ver on golf_courses(status, verification_status);
create index if not exists idx_golf_courses_last_verified on golf_courses(last_verified_at desc);

-- Table: booking_policies
create table if not exists booking_policies (
  id uuid primary key default gen_random_uuid(),
  golf_course_id uuid not null references golf_courses(id) on delete cascade,
  policy_type text not null,
  source_text text,
  policy_summary text,
  days_before_open integer,
  open_weekday smallint,
  open_time time,
  monthly_open_day smallint,
  monthly_offset_months smallint,
  rule_interpretation text,
  manual_open_datetime timestamptz,
  formula_json jsonb,
  effective_from date,
  effective_to date,
  is_active boolean not null default true,
  last_verified_at timestamptz,
  confidence_score numeric(3,2),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists idx_bp_golf_course on booking_policies(golf_course_id);
create index if not exists idx_bp_type_active on booking_policies(policy_type, is_active);
create index if not exists idx_bp_active_partial on booking_policies(golf_course_id) where is_active = true;

-- Table: source_records
create table if not exists source_records (
  id uuid primary key default gen_random_uuid(),
  golf_course_id uuid not null references golf_courses(id) on delete cascade,
  booking_policy_id uuid references booking_policies(id) on delete set null,
  source_type text not null,
  source_url text,
  source_title text,
  captured_text text,
  screenshot_path text,
  checked_at timestamptz not null default now(),
  checked_by uuid,
  is_current boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_sr_course_checked on source_records(golf_course_id, checked_at desc);
create index if not exists idx_sr_policy on source_records(booking_policy_id);
create index if not exists idx_sr_type on source_records(source_type);

-- Table: change_logs
create table if not exists change_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  changed_fields jsonb,
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_cl_entity on change_logs(entity_type, entity_id);
create index if not exists idx_cl_actor on change_logs(actor_id, created_at desc);

-- Table: user_reports
create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  golf_course_id uuid references golf_courses(id) on delete set null,
  booking_policy_id uuid references booking_policies(id) on delete set null,
  reporter_email text,
  report_type text not null,
  message text not null,
  status text not null default 'new',
  resolved_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index if not exists idx_ur_status_created on user_reports(status, created_at desc);
create index if not exists idx_ur_course on user_reports(golf_course_id);

-- Optional: computed_open_cache table for future caching
create table if not exists computed_open_cache (
  id uuid primary key default gen_random_uuid(),
  golf_course_id uuid not null references golf_courses(id) on delete cascade,
  play_date date not null,
  open_datetime timestamptz,
  status text,
  policy_version_hash text,
  computed_at timestamptz not null default now(),
  unique (golf_course_id, play_date, policy_version_hash)
);
create index if not exists idx_coc_open_datetime on computed_open_cache(open_datetime);

-- RLS and policies will be added separately depending on Supabase setup.

-- End of migration
