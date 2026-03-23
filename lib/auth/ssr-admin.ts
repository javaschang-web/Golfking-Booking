import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export type AdminRole = 'owner' | 'admin' | 'editor' | 'viewer'

export type AdminProfile = {
  id: string
  email: string
  role: AdminRole
  display_name: string | null
  is_active: boolean
}

export async function getCurrentUserFromServer() {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getCurrentAdminProfileFromServer(): Promise<AdminProfile | null> {
  const user = await getCurrentUserFromServer()
  if (!user) return null

  const supabase = createServiceRoleSupabaseClient()
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, email, role, display_name, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data || !data.is_active) return null
  return data as AdminProfile
}

export async function requireAdminFromServer(allowedRoles?: AdminRole[]) {
  const profile = await getCurrentAdminProfileFromServer()
  if (!profile) redirect('/admin/login')

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect('/admin')
  }

  return profile
}
