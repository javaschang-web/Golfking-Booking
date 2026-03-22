import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/ssr'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

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

export async function getCurrentAdminProfileFromServer() {
  const user = await getCurrentUserFromServer()
  if (!user) return null

  const supabase = createServiceRoleSupabaseClient()
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, email, role, display_name, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data || !data.is_active) return null
  return data
}
