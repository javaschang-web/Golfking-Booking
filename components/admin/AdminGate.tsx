'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import { colors, ui } from '@/lib/design'

export type AdminProfile = {
  id: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  display_name: string | null
  is_active: boolean
}

type NavLink = {
  href: string
  label: string
}

type Props = {
  title: string
  children: React.ReactNode
  navLinks?: NavLink[]
  initialProfile?: AdminProfile | null
}

export function AdminGate({ title, children, navLinks = [], initialProfile = null }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(!initialProfile)
  const [profile, setProfile] = useState<AdminProfile | null>(initialProfile)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialProfile) return

    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data: sessionData } = await supabase.auth.getUser()
      const currentUser = sessionData.user

      if (!currentUser) {
        router.replace('/admin/login')
        return
      }

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, email, role, display_name, is_active')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error || !data || !data.is_active) {
        setError('관리자 권한이 없거나 비활성 계정이야.')
        setLoading(false)
        return
      }

      setProfile(data as AdminProfile)
      setLoading(false)
    }

    load()
  }, [router, initialProfile])

  if (loading) return <main style={ui.page}><div style={ui.shell}><p>관리자 세션 확인 중...</p></div></main>
  if (error || !profile) return <main style={ui.page}><div style={ui.shell}><p style={{ color: colors.danger }}>{error ?? '관리자 접근 권한이 없어.'}</p></div></main>

  return (
    <main style={ui.page}>
      <div style={ui.shell}>
        <section style={ui.hero}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...ui.badge, width: 'fit-content', marginBottom: 10 }}>Admin</div>
              <h1 style={{ margin: 0 }}>{title}</h1>
              <p style={{ margin: '8px 0 0 0', color: colors.textSoft }}>관리자: {profile.email} ({profile.role})</p>
            </div>
            <AdminLogoutButton />
          </div>

          {navLinks.length > 0 ? (
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} style={ui.link}>{link.label}</Link>
              ))}
            </div>
          ) : null}
        </section>

        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
    </main>
  )
}
