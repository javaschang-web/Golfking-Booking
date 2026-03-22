const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function parseDateInKST(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - KST_OFFSET_MS)
}

export function formatKSTDateTime(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function setKSTTime(baseDate: Date, timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const utc = new Date(baseDate)
  utc.setUTCHours(hours - 9, minutes, 0, 0)
  return utc
}

export function addDaysKST(baseDate: Date, days: number) {
  const next = new Date(baseDate)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function startOfMonthKST(baseDate: Date) {
  const year = baseDate.getUTCFullYear()
  const month = baseDate.getUTCMonth()
  return new Date(Date.UTC(year, month, 1, -9, 0, 0))
}

export function addMonthsKST(baseDate: Date, months: number) {
  const next = new Date(baseDate)
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}
