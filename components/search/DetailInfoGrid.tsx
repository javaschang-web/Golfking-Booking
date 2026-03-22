import type { PublicCourseDetail } from '@/lib/queries/course-detail'

export function DetailInfoGrid({ course }: { course: PublicCourseDetail }) {
  const items = [
    ['지역', `${course.region_primary}${course.region_secondary ? ` / ${course.region_secondary}` : ''}`],
    ['주소', course.address ?? '-'],
    ['전화', course.phone ?? '-'],
    ['회원권 필요', course.membership_required ? '예' : '아니오'],
    ['최근 검수', course.last_verified_at ? new Date(course.last_verified_at).toLocaleString('ko-KR') : '-'],
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
          <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
          <div style={{ marginTop: 6 }}>{value}</div>
        </div>
      ))}
    </div>
  )
}
