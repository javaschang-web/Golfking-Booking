import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export type PublicCourseDetail = {
  id: string
  slug: string
  name: string
  english_name: string | null
  region_primary: string
  region_secondary: string | null
  address: string | null
  phone: string | null
  homepage_url: string | null
  booking_url: string | null
  map_url: string | null
  membership_required: boolean
  membership_note: string | null
  cancellation_policy_summary: string | null
  booking_note: string | null
  status: string
  verification_status: string
  last_verified_at: string | null
  booking_policies: Array<{
    id: string
    policy_type: string
    policy_summary: string | null
    source_text: string | null
    days_before_open: number | null
    open_weekday: number | null
    open_time: string | null
    monthly_open_day: number | null
    monthly_offset_months: number | null
    rule_interpretation: string | null
    manual_open_datetime: string | null
    is_active: boolean
    last_verified_at: string | null
    note: string | null
  }>
  source_records: Array<{
    id: string
    source_type: string
    source_url: string | null
    source_title: string | null
    captured_text: string | null
    checked_at: string
    is_current: boolean
    note: string | null
  }>
}

export async function getPublicCourseDetail(slug: string) {
  const supabase = createServiceRoleSupabaseClient()

  const { data, error } = await supabase
    .from('golf_courses')
    .select(`
      id,
      slug,
      name,
      english_name,
      region_primary,
      region_secondary,
      address,
      phone,
      homepage_url,
      booking_url,
      map_url,
      membership_required,
      membership_note,
      cancellation_policy_summary,
      booking_note,
      status,
      verification_status,
      last_verified_at,
      booking_policies (
        id,
        policy_type,
        policy_summary,
        source_text,
        days_before_open,
        open_weekday,
        open_time,
        monthly_open_day,
        monthly_offset_months,
        rule_interpretation,
        manual_open_datetime,
        is_active,
        last_verified_at,
        note
      ),
      source_records (
        id,
        source_type,
        source_url,
        source_title,
        captured_text,
        checked_at,
        is_current,
        note
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('verification_status', 'verified')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as PublicCourseDetail | null
}
