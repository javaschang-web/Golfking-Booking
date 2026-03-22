import type { PublicCourseRow } from '@/lib/queries/courses'
import { calculateOpenDatetime, formatCalculatedResult } from '@/lib/booking-rules/calculate'
import { ResultStatusBadge } from '@/components/search/ResultStatusBadge'
import { EmptySearchState } from '@/components/search/EmptySearchState'

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
          <article key={course.id} style={{ border: '1px solid #e5e5e5', padding: 16, borderRadius: 8, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>{course.name}</h3>
              {calculated ? <ResultStatusBadge status={calculated.status} /> : null}
            </div>
            <p style={{ margin: '8px 0' }}>
              지역: {course.region_primary}{course.region_secondary ? ` / ${course.region_secondary}` : ''}
            </p>
            {playDate ? <p style={{ margin: '8px 0' }}>희망 날짜: {playDate}</p> : null}
            <p style={{ margin: '8px 0' }}>회원권 필요: {course.membership_required ? '예' : '아니오'}</p>
            <p style={{ margin: '8px 0' }}>정책 타입: {activePolicy?.policy_type ?? '미정'}</p>
            <p style={{ margin: '8px 0' }}>정책 요약: {activePolicy?.policy_summary ?? course.booking_note ?? '요약 없음'}</p>
            <p style={{ margin: '8px 0', fontWeight: 600 }}>
              예약 오픈 계산: {calculated ? formatCalculatedResult(calculated) : '플레이 날짜를 입력해줘'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {course.booking_url ? (
                <a href={course.booking_url} target="_blank" rel="noreferrer">예약 링크</a>
              ) : null}
              {course.map_url ? (
                <a href={course.map_url} target="_blank" rel="noreferrer">지도 링크</a>
              ) : null}
              <a href={detailHref}>상세 보기</a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
