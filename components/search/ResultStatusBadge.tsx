import { getStatusBadgeStyle } from '@/lib/status-badge'

type Props = {
  status: 'ok' | 'needs_review' | 'unknown'
}

export function ResultStatusBadge({ status }: Props) {
  const { label, style } = getStatusBadgeStyle(status)

  return (
    <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, ...style }}>
      {label}
    </span>
  )
}
