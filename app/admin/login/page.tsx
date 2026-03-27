import Link from 'next/link'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { colors, ui } from '@/lib/design'

export default function AdminLoginPage() {
  return (
    <main style={ui.page}>
      <div style={ui.shell}>
        <section style={{ ...ui.hero, maxWidth: 720, margin: '0 auto' }}>
          <div style={{ ...ui.badge, width: 'fit-content', marginBottom: 12 }}>Admin Access</div>
          <h1 style={{ marginTop: 0 }}>관리자 로그인</h1>
          <p style={{ color: colors.textSoft }}>Supabase Auth 계정으로 로그인한 뒤 관리자 페이지에 접근할 수 있어.</p>
          <AdminLoginForm />
          <p style={{ marginTop: 20 }}>
            <Link href="/" style={ui.link}>홈으로 돌아가기</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
