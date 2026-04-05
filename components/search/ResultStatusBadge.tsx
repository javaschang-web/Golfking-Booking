type Props = {
  status: 'ok' | 'needs_review' | 'unknown'
}

export function ResultStatusBadge({ status }: Props) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-[#123622] px-3 py-1 text-xs font-bold text-[#92f2a4]">
        계산 완료
      </span>
    )
  }

  if (status === 'needs_review') {
    return (
      <span className="inline-flex items-center rounded-full border border-[#6b5a1e] bg-[#3f3614] px-3 py-1 text-xs font-bold text-[#ffd86b]">
        검수 필요
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[#37576a] bg-[#20313b] px-3 py-1 text-xs font-bold text-[#b8d7ff]">
      정보 부족
    </span>
  )
}
