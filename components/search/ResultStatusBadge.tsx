type Props = {
  status: 'ok' | 'needs_review' | 'unknown'
}

export function ResultStatusBadge({ status }: Props) {
  const label = status === 'ok' ? '계산 완료' : status === 'needs_review' ? '검토 필요' : '정보 부족'
  const background = status === 'ok' ? '#e8f7e8' : status === 'needs_review' ? '#fff3cd' : '#f1f3f5'
  const color = status === 'ok' ? '#1f6b2c' : status === 'needs_review' ? '#8a6500' : '#495057'

  return (
    <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 999, background, color, fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  )
}
