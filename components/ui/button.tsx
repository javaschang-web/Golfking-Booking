import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ' +
    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 '

  const styles =
    variant === 'primary'
      ? 'bg-primary text-bg hover:bg-primary-strong'
      : 'border border-border bg-primary-muted text-text hover:bg-panel-alt'

  return <button className={base + styles + ' ' + className} {...props} />
}

