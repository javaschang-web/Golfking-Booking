import type { User } from '@supabase/supabase-js'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export type AdminRole = 'owner' | 'admin' | 'editor' | 'viewer'

export type AdminProfile = {
  id: string
  email: string
  role: AdminRole
  display_name: string | null
  is_active: boolean
}

export async function getAdminProfile(user: User): Promise<AdminProfile | null> {
  const supabase = createServiceRoleSupabaseClient()

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, email, role, display_name, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data || !data.is_active) return null

  return data as AdminProfile
}

export function canAccessAdmin(profile: AdminProfile | null) {
  if (!profile) return false
  return ['owner', 'admin', 'editor', 'viewer'].includes(profile.role)
}

export function canManageContent(profile: AdminProfile | null) {
  if (!profile) return false
  return ['owner', 'admin', 'editor'].includes(profile.role)
}

export function canManageAdmins(profile: AdminProfile | null) {
  if (!profile) return false
  return ['owner', 'admin'].includes(profile.role)
}
