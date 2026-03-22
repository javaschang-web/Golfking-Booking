'use client'

import { AdminGate } from '@/components/admin/AdminGate'
import { AdminReportsTable } from '@/components/admin/AdminReportsTable'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'

export default function AdminReportsPage() {
  return (
    <AdminGate
      title="사용자 제보 관리"
      navLinks={[
        { href: '/admin', label: '대시보드' },
        { href: '/admin/courses', label: '골프장 목록' },
        { href: '/admin/courses/new', label: '신규 등록' },
        { href: '/', label: '홈' },
      ]}
    >
      <AdminSectionCard title="제보 목록" description="사용자 피드백을 검토하고 운영 반영 여부를 판단할 수 있어.">
        <AdminReportsTable />
      </AdminSectionCard>
    </AdminGate>
  )
}
