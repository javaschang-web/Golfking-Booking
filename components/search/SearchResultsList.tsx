import type { PublicCourseRow } from '@/lib/queries/courses'
import { calculateOpenDatetime, formatCalculatedResult } from '@/lib/booking-rules/calculate'
import { ResultStatusBadge } from '@/components/search/ResultStatusBadge'
import { EmptySearchState } from '@/components/search/EmptySearchState'
import { colors, ui } from '@/lib/design'

type Props = {
  courses: PublicCourseRow[]
  playDate?: string
  region?: string
}

export function SearchResultsList({ courses, playDate, region }: Props) {
  if (courses.length === 0) {
    return <EmptySearchState />
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {courses.map((course) => {
        const activePolicy = course.booking_policies?.find((policy) => policy.is_active)
        const calculated = playDate ? calculateOpenDatetime(playDate, activePolicy) : null
        const detailParams = new URLSearchParams()
        if (playDate) detailParams.set('date', playDate)
        if (region) detailParams.set('region', region)
        const detailHref = `/courses/${course.slug}${detailParams.toString() ? `?${detailParams.toString()}` : ''}`

        return (
          <article key={course.id} style={ui.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 24 }}>{course.name}</h3>
                <div style={{ ...ui.badge, width: 'fit-content' }}>
                  {course.region_primary}{course.region_secondary ? ` / ${course.region_secondary}` : ''}
                </div>
              </div>
              {calculated ? <ResultStatusBadge status={calculated.status} /> : null}
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 16, color: colors.textSoft }}>
              {playDate ? <p style={{ margin: 0, lineHeight: 1.5 }}>희망 날짜: {playDate}</p> : null}
              <p style={{ margin: 0, lineHeight: 1.5 }}>회원권 필요: {course.membership_required ? '예' : '아니오'}</p>
              <p style={{ margin: 0, lineHeight: 1.5 }}>정책 타입: {activePolicy?.policy_type ?? '미정'}</p>
              <p style={{ margin: 0, lineHeight: 1.6 }}>정책 요약: {activePolicy?.policy_summary ?? course.booking_note ?? '요약 없음'}</p>
            </div>

            <div style={{ marginTop: 16, ...ui.subCard }}>
              <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 6 }}>예약 오픈 계산</div>
              <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.5 }}>{calculated ? formatCalculatedResult(calculated) : '플레이 날짜를 입력해줘'}</div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {course.booking_url ? (
                <a href={course.booking_url} target="_blank" rel="noreferrer" style={{ ...ui.buttonPrimary, textAlign: 'center', textDecoration: 'none' }}>예약 링크</a>
              ) : null}
              {course.map_url ? (
                <a href={course.map_url} target="_blank" rel="noreferrer" style={{ ...ui.buttonSecondary, textAlign: 'center', textDecoration: 'none' }}>지도 링크</a>
              ) : null}
              <a href={detailHref} style={{ ...ui.buttonSecondary, textAlign: 'center', textDecoration: 'none' }}>상세 보기</a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
