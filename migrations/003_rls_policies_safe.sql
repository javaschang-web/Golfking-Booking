-- 003_rls_policies_safe.sql
-- Safe RLS policy application for GolfKing Booking (no invalid WITH CHECK usage)

-- Drop possibly-conflicting policies first
DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_can_select_public_courses ON golf_courses';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_no_mod ON golf_courses';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_select_policies ON booking_policies';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_no_mod_policies ON booking_policies';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS admin_full_access_golf_courses ON golf_courses';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS admin_full_access_policies ON booking_policies';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS admin_full_access_source ON source_records';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_select_source_metadata ON source_records';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_no_mod_source ON source_records';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS public_insert_reports ON user_reports';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS anon_insert_reports ON user_reports';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS authenticated_insert_reports ON user_reports';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS admin_manage_reports ON user_reports';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS admin_change_logs ON change_logs';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS is enabled on the target tables
ALTER TABLE IF EXISTS golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_reports ENABLE ROW LEVEL SECURITY;

-- 1) Public / anon role: allow read on verified active golf courses
CREATE POLICY anon_can_select_public_courses ON golf_courses
  FOR SELECT
  TO public
  USING (status = 'active' AND verification_status = 'verified');

-- 2) Public: no modifications on golf_courses (deny all write/read via using(false) for safety if needed)
CREATE POLICY anon_no_mod ON golf_courses
  FOR ALL
  TO public
  USING (false);

-- 3) Booking policies: public select only when linked course is public and policy is_active
CREATE POLICY anon_select_policies ON booking_policies
  FOR SELECT
  TO public
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM golf_courses gc
      WHERE gc.id = booking_policies.golf_course_id
        AND gc.status = 'active'
        AND gc.verification_status = 'verified'
    )
  );

-- 4) Booking policies: public cannot modify
CREATE POLICY anon_no_mod_policies ON booking_policies
  FOR ALL
  TO public
  USING (false);

-- 5) Admin role (authenticated): allow full access based on admin_profiles role
-- Note: assumes auth.uid() returns UUID that matches admin_profiles.id; adjust if your auth mapping differs.
CREATE POLICY admin_full_access_golf_courses ON golf_courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  );

CREATE POLICY admin_full_access_policies ON booking_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  );

-- 6) Source records: admins can insert/update; public can only select metadata (no WITH CHECK on select)
CREATE POLICY admin_full_access_source ON source_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin','editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin','editor')
    )
  );

CREATE POLICY anon_select_source_metadata ON source_records
  FOR SELECT
  TO public
  USING (is_current = true);

-- Deny public modifications to source_records
CREATE POLICY anon_no_mod_source ON source_records
  FOR ALL
  TO public
  USING (false);

-- 7) user_reports: allow anon/authenticated inserts, admins manage
GRANT INSERT ON TABLE public.user_reports TO anon;
GRANT INSERT ON TABLE public.user_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_reports TO service_role;

CREATE POLICY anon_insert_reports ON user_reports
  FOR INSERT
  TO anon
  WITH CHECK (
    report_type IS NOT NULL
    AND message IS NOT NULL
  );

CREATE POLICY authenticated_insert_reports ON user_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    report_type IS NOT NULL
    AND message IS NOT NULL
  );

CREATE POLICY admin_manage_reports ON user_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  );

-- 8) change_logs: admins only
CREATE POLICY admin_change_logs ON change_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles ap
      WHERE ap.id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('owner','admin')
    )
  );

-- Notes:
-- - auth.uid() usage assumes Supabase auth where jwt.sub matches admin_profiles.id (UUID). If your auth mapping differs (e.g. jwt.sub is text), adapt the policy checks accordingly.
-- - Test policy behavior with both an anon role and an authenticated admin user before enabling in production.
