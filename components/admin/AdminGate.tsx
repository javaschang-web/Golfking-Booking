'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import { Container } from '@/components/ui/container'
import { Card } from '@/components/ui/card'

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

  if (loading)
    return (
      <main>
        <Container>
          <Card>
            <p className="m-0 text-sm text-text-soft">관리자 세션 확인 중...</p>
          </Card>
        </Container>
      </main>
    )

  if (error || !profile)
    return (
      <main>
        <Container>
          <Card>
            <p className="m-0 text-sm font-semibold text-danger">{error ?? '관리자 접근 권한이 없어.'}</p>
            <p className="mt-2 text-sm text-text-soft">로그인이 풀렸을 수도 있어. 다시 로그인해줘.</p>
            <Link href="/admin/login" className="mt-3 inline-block text-sm font-semibold text-primary-strong hover:underline">
              /admin/login 이동
            </Link>
          </Card>
        </Container>
      </main>
    )

  return (
    <main>
      <Container>
        <Card className="bg-gradient-to-br from-panel-alt to-panel shadow-hero">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-primary-muted px-3 py-1 text-xs font-semibold text-text">
                Admin
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-text-soft">
                관리자: <span className="font-semibold">{profile.email}</span> ({profile.role})
              </p>
            </div>
            <AdminLogoutButton />
          </div>

          {navLinks.length > 0 ? (
            <nav className="mt-5 flex flex-wrap gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border bg-primary-muted px-3 py-1 text-sm font-semibold text-text hover:bg-panel-alt"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </Card>

        <div className="mt-6">{children}</div>
      </Container>
    </main>
  )
}
