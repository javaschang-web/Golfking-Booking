import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={
        'w-full rounded-xl border border-border bg-bg-soft px-4 py-3 text-text ' +
        'placeholder:text-text-soft/70 focus:outline-none focus:ring-2 focus:ring-primary/50 ' +
        'min-h-24 resize-y ' +
        className
      }
      {...props}
    />
  )
}

