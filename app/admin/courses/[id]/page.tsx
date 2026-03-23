import { AdminGate } from '@/components/admin/AdminGate'
import { AdminCourseEditForm } from '@/components/admin/AdminCourseEditForm'
import { AdminPolicyManager } from '@/components/admin/AdminPolicyManager'
import { AdminSourceRecordManager } from '@/components/admin/AdminSourceRecordManager'
import { AdminCourseVerificationPanel } from '@/components/admin/AdminCourseVerificationPanel'
import { AdminSectionCard } from '@/components/admin/AdminSectionCard'
import { requireAdminFromServer } from '@/lib/auth/ssr-admin'

export default async function AdminCourseEditPage({ params }: { params: { id: string } }) {
  const profile = await requireAdminFromServer(['owner', 'admin', 'editor'])

  return (
    <AdminGate
      initialProfile={profile}
      title="골프장 수정"
      navLinks={[
        { href: '/admin', label: '대시보드' },
        { href: '/admin/courses', label: '골프장 목록' },
        { href: '/admin/courses/new', label: '신규 등록' },
      ]}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <AdminSectionCard title="기본 정보 수정" description="골프장 기본 정보와 공개 상태를 수정할 수 있어.">
          <AdminCourseEditForm courseId={params.id} />
        </AdminSectionCard>
        <AdminSectionCard title="검수 정보" description="최근 확인일과 검수 상태를 별도로 관리하는 구간이야.">
          <AdminCourseVerificationPanel courseId={params.id} />
        </AdminSectionCard>
        <AdminSectionCard title="예약 정책" description="예약 오픈 규칙을 추가/수정하고 활성 상태를 조정할 수 있어.">
          <AdminPolicyManager courseId={params.id} />
        </AdminSectionCard>
        <AdminSectionCard title="출처 / 검수 기록" description="정책 근거가 되는 링크와 원문을 남겨두는 구간이야.">
          <AdminSourceRecordManager courseId={params.id} />
        </AdminSectionCard>
      </div>
    </AdminGate>
  )
}
