import { colors, ui } from '@/lib/design'

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
    <div style={{ ...ui.card, display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <strong style={{ fontSize: 18 }}>검색 요약</strong>
          <p style={{ margin: 0, color: colors.textSoft }}>선택한 조건에 맞는 골프장과 예약 오픈 일정을 한 번에 볼 수 있어.</p>
        </div>
        <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
          <SummaryStat label="검색 결과" value={`${total}개`} />
          <SummaryStat label="지역" value={region || '전체'} />
          <SummaryStat label="플레이 날짜" value={playDate || '미입력'} />
        </div>
      </div>

      {playDate ? (
        hasCalendar ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <strong style={{ fontSize: 16 }}>예약 오픈 달력</strong>
              <p style={{ margin: '6px 0 0', color: colors.textSoft, fontSize: 14 }}>
                아래 숫자에 마우스를 올리면 해당 날짜에 예약 가능한 골프장 이름을 볼 수 있어.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {entries.map((entry) => (
                <div
                  key={entry.dateKey}
                  style={{
                    ...ui.subCard,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 180px) 1fr',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSoft, marginBottom: 4 }}>예약 오픈 일자</div>
                    <strong style={{ fontSize: 17 }}>{entry.label}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: colors.textSoft }}>예약 가능 골프장</span>
                    <span
                      title={entry.names.join('\n')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 56,
                        height: 40,
                        padding: '0 14px',
                        borderRadius: 999,
                        background: colors.primary,
                        color: '#06240e',
                        fontWeight: 900,
                        fontSize: 18,
                        cursor: 'help',
                      }}
                    >
                      {entry.count}
                    </span>
                    <span style={{ color: colors.textSoft, fontSize: 13 }}>hover 하면 골프장 리스트 표시</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...ui.subCard, color: colors.textSoft, fontSize: 14 }}>
            플레이 날짜는 입력됐지만 계산 가능한 예약 오픈 정책이 있는 골프장이 아직 없어.
          </div>
        )
      ) : (
        <div style={{ ...ui.subCard, color: colors.textSoft, fontSize: 14 }}>
          플레이 날짜를 입력하면 예약 오픈 일자별로 예약 가능한 골프장 수를 달력 형태로 같이 보여줄게.
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...ui.subCard, padding: 14, display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: colors.textSoft }}>{label}</span>
      <strong style={{ fontSize: 16 }}>{value}</strong>
    </div>
  )
}
