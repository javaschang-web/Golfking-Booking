import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        'rounded-3xl border border-border bg-panel shadow-glass backdrop-blur-sm ' +
        'px-5 py-5 sm:px-6 sm:py-6 ' +
        className
      }
    >
      {children}
    </div>
  )
}

