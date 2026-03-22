-- 004_fix_user_reports_rls.sql
-- Fix anon insert for user_reports

alter table if exists user_reports enable row level security;

-- Remove old policies if present
DROP POLICY IF EXISTS public_insert_reports ON user_reports;
DROP POLICY IF EXISTS anon_insert_reports ON user_reports;
DROP POLICY IF EXISTS authenticated_insert_reports ON user_reports;
DROP POLICY IF EXISTS admin_manage_reports ON user_reports;

-- Ensure API roles can access the table at the privilege layer
GRANT INSERT ON TABLE public.user_reports TO anon;
GRANT INSERT ON TABLE public.user_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_reports TO service_role;

-- Allow anonymous/public report submission
CREATE POLICY anon_insert_reports ON user_reports
  FOR INSERT
  TO anon
  WITH CHECK (
    report_type IS NOT NULL
    AND message IS NOT NULL
  );

-- Optional: authenticated users may also submit reports
CREATE POLICY authenticated_insert_reports ON user_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    report_type IS NOT NULL
    AND message IS NOT NULL
  );

-- Admins can manage reports
CREATE POLICY admin_manage_reports ON user_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner', 'admin')
    )
  );
