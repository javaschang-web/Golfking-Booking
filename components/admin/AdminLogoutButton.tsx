'use client'

import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} variant="secondary">
      로그아웃
    </Button>
  )
}
