import Link from 'next/link'

export type AdminBreadcrumbItem = {
  href?: string
  label: string
}

export function AdminBreadcrumbs({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 14, color: '#666' }}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          {index < items.length - 1 ? ' / ' : ''}
        </span>
      ))}
    </nav>
  )
}
