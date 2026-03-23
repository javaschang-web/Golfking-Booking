import { AdminGate } from '@/components/admin/AdminGate'
import { AdminDashboardCards } from '@/components/admin/AdminDashboardCards'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'
import { AdminServerNotice } from '@/components/admin/AdminServerNotice'
import { AdminOpsSummary } from '@/components/admin/AdminOpsSummary'
import { requireAdminFromServer } from '@/lib/auth/ssr-admin'

export default async function AdminPage() {
  const profile = await requireAdminFromServer()

  return (
    <AdminGate
      initialProfile={profile}
      title="관리자 대시보드"
      navLinks={[
        { href: '/admin/courses', label: '골프장 관리' },
        { href: '/admin/reports', label: '제보 관리' },
        { href: '/admin/logs', label: '변경 이력' },
        { href: '/', label: '공개 홈으로 이동' },
      ]}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <AdminServerNotice />
        <AdminSectionCard title="운영 상태" description="현재 운영 현황을 빠르게 보는 요약 카드야.">
          <AdminOpsSummary />
        </AdminSectionCard>
        <AdminSectionCard title="기능 범위" description="현재 연결되어 있는 주요 기능 범위 요약이야.">
          <p style={{ margin: 0 }}>
            골프장 CRUD, 정책 CRUD, 출처 관리, 제보 목록, 공개 검색/상세, 배포/운영 문서까지 연결된 상태야.
          </p>
        </AdminSectionCard>
        <AdminDashboardCards />
      </div>
    </AdminGate>
  )
}
