'use client'

import { AdminGate } from '@/components/admin/AdminGate'
import { AdminDashboardCards } from '@/components/admin/AdminDashboardCards'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'

export default function AdminPage() {
  return (
    <AdminGate
      title="관리자 대시보드"
      navLinks={[
        { href: '/admin/courses', label: '골프장 관리' },
        { href: '/admin/reports', label: '제보 관리' },
        { href: '/', label: '공개 홈으로 이동' },
      ]}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <AdminSectionCard title="운영 상태" description="현재 관리자 기능의 연결 범위 요약이야.">
          <p style={{ margin: 0 }}>
            골프장 CRUD, 정책 CRUD, 출처 관리, 제보 목록, 공개 검색/상세까지 연결된 상태야.
          </p>
        </AdminSectionCard>
        <AdminDashboardCards />
      </div>
    </AdminGate>
  )
}
