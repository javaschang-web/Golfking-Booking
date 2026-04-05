import Link from 'next/link'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'

export default function AdminLoginPage() {
  return (
    <main>
      <Container>
        <div className="mx-auto max-w-2xl">
          <Card className="bg-gradient-to-br from-panel-alt to-panel shadow-hero">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-primary-muted px-3 py-1 text-xs font-semibold text-text">
              Admin Access
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">관리자 로그인</h1>
            <p className="mt-2 text-sm text-text-soft">
              Supabase Auth 계정으로 로그인한 뒤 관리자 페이지에 접근할 수 있어.
            </p>

            <div className="mt-6">
              <AdminLoginForm />
            </div>

            <div className="mt-6">
              <Link href="/" className="text-sm font-semibold text-primary-strong hover:underline">
                홈으로 돌아가기
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  )
}
