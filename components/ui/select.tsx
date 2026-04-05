import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={
        'w-full appearance-none rounded-xl border border-border bg-bg-soft px-4 py-3 text-text ' +
        'focus:outline-none focus:ring-2 focus:ring-primary/50 ' +
        className
      }
      {...props}
    />
  )
}

