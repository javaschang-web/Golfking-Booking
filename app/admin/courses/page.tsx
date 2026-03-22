'use client'

import { AdminGate } from '@/components/admin/AdminGate'
import { AdminCoursesTable } from '@/components/admin/AdminCoursesTable'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'

export default function AdminCoursesPage() {
  return (
    <AdminGate
      title="골프장 관리"
      navLinks={[
        { href: '/admin', label: '대시보드' },
        { href: '/admin/courses/new', label: '신규 등록' },
        { href: '/admin/reports', label: '제보 관리' },
        { href: '/', label: '홈' },
      ]}
    >
      <AdminSectionCard title="골프장 목록" description="등록된 골프장 상태와 검수 상태를 한 번에 볼 수 있어.">
        <AdminCoursesTable />
      </AdminSectionCard>
    </AdminGate>
  )
}
