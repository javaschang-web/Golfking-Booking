import { Card } from '@/components/ui/card'

type CalendarEntry = {
  dateKey: string
  label: string
  count: number
  names: string[]
}

type Props = {
  total: number
  region?: string
  playDate?: string
  entries?: CalendarEntry[]
}

export function SearchSummary({ total, region, playDate, entries = [] }: Props) {
  const hasCalendar = Boolean(playDate && entries.length > 0)

  return (
    <Card className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <strong className="text-base">검색 요약</strong>
          <p className="m-0 text-sm text-text-soft">선택한 조건에 맞는 골프장과 예약 오픈 일정을 한 번에 볼 수 있어.</p>
        </div>

        <div className="grid w-full gap-2 sm:w-auto sm:min-w-64 sm:grid-cols-3">
          <SummaryStat label="검색 결과" value={`${total}개`} />
          <SummaryStat label="지역" value={region || '전체'} />
          <SummaryStat label="플레이 날짜" value={playDate || '미입력'} />
        </div>
      </div>

      {playDate ? (
        hasCalendar ? (
          <div className="grid gap-4">
            <div>
              <strong className="text-sm">예약 오픈 달력</strong>
              <p className="mt-1 text-sm text-text-soft">
                숫자에 마우스를 올리면 해당 날짜에 예약 가능한 골프장 이름을 볼 수 있어.
              </p>
            </div>

            <div className="grid gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.dateKey}
                  className="grid items-center gap-3 rounded-2xl border border-border bg-bg-soft px-4 py-4 sm:grid-cols-[220px_1fr]"
                >
                  <div>
                    <div className="text-xs font-semibold text-text-soft">예약 오픈 날짜</div>
                    <div className="mt-1 text-sm font-semibold">{entry.label}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-text-soft">예약 가능 골프장</span>
                    <span
                      title={entry.names.join('\n')}
                      className="inline-flex h-10 min-w-14 cursor-help items-center justify-center rounded-full bg-primary px-4 text-lg font-black text-bg"
                    >
                      {entry.count}
                    </span>
                    <span className="text-xs text-text-soft">hover 하면 리스트 표시</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-bg-soft px-4 py-4 text-sm text-text-soft">
            플레이 날짜는 입력했지만, 계산 가능한 예약 오픈 정책이 있는 골프장이 아직 없어.
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-border bg-bg-soft px-4 py-4 text-sm text-text-soft">
          플레이 날짜를 입력하면 예약 오픈 날짜별로 예약 가능한 골프장 수를 달력 형태로 같이 보여줄게.
        </div>
      )}
    </Card>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
      <div className="text-xs font-semibold text-text-soft">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}
