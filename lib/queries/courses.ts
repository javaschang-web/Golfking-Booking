import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export type PublicCourseRow = {
  id: string
  slug: string
  name: string
  region_primary: string
  region_secondary: string | null
  booking_url: string | null
  map_url: string | null
  membership_required: boolean
  booking_note: string | null
  verification_status: string
  status: string
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
  }>
}

export async function getPublicCourses(region?: string) {
  const supabase = createServiceRoleSupabaseClient()

  let query = supabase
    .from('golf_courses')
    .select(`
      id,
      slug,
      name,
      region_primary,
      region_secondary,
      booking_url,
      map_url,
      membership_required,
      booking_note,
      verification_status,
      status,
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
        is_active
      )
    `)
    .eq('status', 'active')
    // Public site: show all active courses regardless of verification_status.
    .order('name', { ascending: true })

  if (region?.trim()) {
    query = query.eq('region_primary', region.trim())
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PublicCourseRow[]
}
