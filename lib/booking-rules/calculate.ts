import { addDaysKST, addMonthsKST, formatKSTDateTime, parseDateInKST, setKSTTime, startOfMonthKST } from '@/lib/utils/kst'

type BookingPolicy = {
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

export type CalculatedOpenResult = {
  status: 'ok' | 'needs_review' | 'unknown'
  openDatetime: string | null
  summary: string
}

export function calculateOpenDatetime(playDate: string, policy: BookingPolicy | undefined): CalculatedOpenResult {
  if (!playDate || !policy) {
    return {
      status: 'unknown',
      openDatetime: null,
      summary: '정책 정보가 없어 계산할 수 없어.',
    }
  }

  switch (policy.policy_type) {
    case 'days_before':
      return calculateDaysBefore(playDate, policy)
    case 'weekday_rule':
      return calculateWeekdayRule(playDate, policy)
    case 'monthly_batch':
      return calculateMonthlyBatch(playDate, policy)
    case 'manual':
      return calculateManual(policy)
    default:
      return {
        status: 'needs_review',
        openDatetime: null,
        summary: policy.policy_summary ?? '복합 정책이라 수동 검토가 필요해.',
      }
  }
}

function calculateDaysBefore(playDate: string, policy: BookingPolicy): CalculatedOpenResult {
  if (policy.days_before_open == null || !policy.open_time) {
    return { status: 'needs_review', openDatetime: null, summary: 'days_before 계산값이 부족해.' }
  }

  const play = parseDateInKST(playDate)
  const openDate = addDaysKST(play, -policy.days_before_open)
  const openDateTime = setKSTTime(openDate, policy.open_time)

  return {
    status: 'ok',
    openDatetime: openDateTime.toISOString(),
    summary: policy.policy_summary ?? `${policy.days_before_open}일 전 ${policy.open_time} 오픈`,
  }
}

function calculateWeekdayRule(playDate: string, policy: BookingPolicy): CalculatedOpenResult {
  if (policy.open_weekday == null || !policy.open_time) {
    return { status: 'needs_review', openDatetime: null, summary: 'weekday_rule 계산값이 부족해.' }
  }

  const play = parseDateInKST(playDate)
  const playWeekday = getKSTWeekday(play)
  let diff = playWeekday - policy.open_weekday

  if (diff < 0) diff += 7

  let weeksBack = 0
  if (policy.rule_interpretation?.includes('next_week')) {
    weeksBack = 1
  }

  const openBase = addDaysKST(play, -(diff + weeksBack * 7))
  const openDateTime = setKSTTime(openBase, policy.open_time)

  return {
    status: 'ok',
    openDatetime: openDateTime.toISOString(),
    summary: policy.policy_summary ?? `매주 지정 요일 ${policy.open_time} 오픈`,
  }
}

function calculateMonthlyBatch(playDate: string, policy: BookingPolicy): CalculatedOpenResult {
  if (policy.monthly_open_day == null || !policy.open_time) {
    return { status: 'needs_review', openDatetime: null, summary: 'monthly_batch 계산값이 부족해.' }
  }

  const play = parseDateInKST(playDate)
  const playMonthStart = startOfMonthKST(play)
  const offsetMonths = policy.monthly_offset_months ?? 1
  const openMonthBase = addMonthsKST(playMonthStart, -offsetMonths)
  const openDate = addDaysKST(openMonthBase, policy.monthly_open_day - 1)
  const openDateTime = setKSTTime(openDate, policy.open_time)

  return {
    status: 'ok',
    openDatetime: openDateTime.toISOString(),
    summary: policy.policy_summary ?? `매월 ${policy.monthly_open_day}일 ${policy.open_time} 오픈`,
  }
}

function calculateManual(policy: BookingPolicy): CalculatedOpenResult {
  if (!policy.manual_open_datetime) {
    return { status: 'needs_review', openDatetime: null, summary: '수동 오픈 시간이 비어 있어.' }
  }

  return {
    status: 'ok',
    openDatetime: policy.manual_open_datetime,
    summary: policy.policy_summary ?? '운영자 지정 수동 오픈',
  }
}

function getKSTWeekday(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  }).format(date)

  const mapping: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return mapping[formatter]
}

export function formatCalculatedResult(result: CalculatedOpenResult) {
  if (!result.openDatetime) return result.summary
  return `${formatKSTDateTime(new Date(result.openDatetime))} · ${result.summary}`
}
