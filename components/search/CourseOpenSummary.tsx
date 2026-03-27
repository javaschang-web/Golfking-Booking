import { calculateOpenDatetime, formatCalculatedResult } from '@/lib/booking-rules/calculate'
import { ResultStatusBadge } from '@/components/search/ResultStatusBadge'
import { colors, ui } from '@/lib/design'

type Policy = {
  policy_type: string
  policy_summary: string | null
  source_text: string | null
  days_before_open: number | null
  open_weekday: number | null
  open_time: string | null
  monthly_open_day: number | null
  monthly_offset_months: number | null
  rule_interpretation: string | null
  manual_open_datetime: string | null
  is_active: boolean
}

export function CourseOpenSummary({ playDate, policy }: { playDate?: string; policy?: Policy }) {
  if (!playDate) {
    return <p style={{ margin: '8px 0', color: colors.textSoft }}>플레이 날짜를 입력하면 예약 오픈 예상 시점을 계산해줄게.</p>
  }

  const result = calculateOpenDatetime(playDate, policy)

  return (
    <div style={ui.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong>예약 오픈 계산</strong>
        <ResultStatusBadge status={result.status} />
      </div>
      <p style={{ margin: '10px 0 0 0', color: colors.textSoft }}>{formatCalculatedResult(result)}</p>
    </div>
  )
}
