import { AdminGate } from '@/components/admin/AdminGate'
import { AdminCourseCreateForm } from '@/components/admin/AdminCourseCreateForm'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'
import { requireAdminFromServer } from '@/lib/auth/ssr-admin'

export default async function AdminCourseNewPage() {
  const profile = await requireAdminFromServer(['owner', 'admin', 'editor'])

  return (
    <AdminGate
      initialProfile={profile}
      title="골프장 신규 등록"
      navLinks={[
        { href: '/admin', label: '대시보드' },
        { href: '/admin/courses', label: '골프장 목록' },
        { href: '/', label: '홈' },
      ]}
    >
      <AdminSectionCard title="신규 골프장 등록" description="기본 정보부터 먼저 입력하고, 저장 후 정책/출처를 이어서 붙이면 돼.">
        <AdminCourseCreateForm />
      </AdminSectionCard>
    </AdminGate>
  )
}
