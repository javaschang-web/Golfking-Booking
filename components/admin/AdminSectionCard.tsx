import type { ReactNode } from 'react'
import { colors, ui } from '@/lib/design'

export function AdminSectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section style={ui.card}>
      <div style={{ marginBottom: 12 }}>
        <strong>{title}</strong>
        {description ? <p style={{ margin: '8px 0 0 0', color: colors.textSoft }}>{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
