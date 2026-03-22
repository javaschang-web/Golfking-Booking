import Link from 'next/link'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <main style={{ padding: 40, maxWidth: 720, margin: '0 auto' }}>
      <h1>관리자 로그인</h1>
      <p>Supabase Auth 계정으로 로그인한 뒤 관리자 페이지에 접근할 수 있어.</p>
      <AdminLoginForm />
      <p style={{ marginTop: 20 }}>
        <Link href="/">홈으로 돌아가기</Link>
      </p>
    </main>
  )
}
