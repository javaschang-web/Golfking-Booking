'use client'

import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

export function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} style={{ padding: '8px 12px' }}>
      로그아웃
    </button>
  )
}
