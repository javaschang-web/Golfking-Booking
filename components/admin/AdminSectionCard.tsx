import type { ReactNode } from 'react'

export function AdminSectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 16, background: '#fff' }}>
      <div style={{ marginBottom: 12 }}>
        <strong>{title}</strong>
        {description ? <p style={{ margin: '8px 0 0 0', color: '#666' }}>{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
