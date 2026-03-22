import Link from 'next/link'

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
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 16, background: '#fff' }}>
            <strong>{item.title}</strong>
            <p style={{ margin: '10px 0 0 0', color: '#555' }}>{item.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
