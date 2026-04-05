import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export function AdminSectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section>
      <Card>
        <div className="mb-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-text-soft">{description}</p> : null}
        </div>
        {children}
      </Card>
    </section>
  )
}
