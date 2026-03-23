import { AdminGate } from '@/components/admin/AdminGate'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'
import { AdminChangeLogsTable } from '@/components/admin/AdminChangeLogsTable'
import { requireAdminFromServer } from '@/lib/auth/ssr-admin'

export default async function AdminLogsPage() {
  const profile = await requireAdminFromServer(['owner', 'admin'])

  return (
    <AdminGate
      initialProfile={profile}
      title="변경 이력"
      navLinks={[
        { href: '/admin', label: '대시보드' },
        { href: '/admin/courses', label: '골프장 목록' },
        { href: '/admin/reports', label: '제보 관리' },
        { href: '/', label: '홈' },
      ]}
    >
      <AdminSectionCard title="최근 변경 이력" description="최근 100개의 변경 기록을 확인할 수 있어.">
        <AdminChangeLogsTable />
      </AdminSectionCard>
    </AdminGate>
  )
}
