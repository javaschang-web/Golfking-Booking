import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={
        'w-full rounded-xl border border-border bg-bg-soft px-4 py-3 text-text ' +
        'placeholder:text-text-soft/70 focus:outline-none focus:ring-2 focus:ring-primary/50 ' +
        className
      }
      {...props}
    />
  )
})
