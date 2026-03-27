import Link from 'next/link'
import { colors, ui } from '@/lib/design'

export function AdminDashboardCards() {
  const items = [
    {
      title: '골프장 관리',
      desc: '등록된 골프장을 보고 새 골프장을 추가하거나 수정할 수 있어.',
      href: '/admin/courses',
    },
    {
      title: '제보 관리',
      desc: '사용자 오류 제보를 검토하고 운영 반영 여부를 판단할 수 있어.',
      href: '/admin/reports',
    },
    {
      title: '신규 등록',
      desc: '새 골프장을 빠르게 등록해 운영 데이터셋을 늘릴 수 있어.',
      href: '/admin/courses/new',
    },
    {
      title: '변경 이력',
      desc: '최근 변경 기록을 보고 운영 히스토리를 확인할 수 있어.',
      href: '/admin/logs',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={ui.card}>
            <strong>{item.title}</strong>
            <p style={{ margin: '10px 0 0 0', color: colors.textSoft }}>{item.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
