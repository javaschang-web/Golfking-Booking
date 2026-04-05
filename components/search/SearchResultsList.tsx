import type { PublicCourseRow } from '@/lib/queries/courses'
import { calculateOpenDatetime, formatCalculatedResult } from '@/lib/booking-rules/calculate'
import { EmptySearchState } from '@/components/search/EmptySearchState'
import { ResultStatusBadge } from '@/components/search/ResultStatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {courses.map((course) => {
        const activePolicy = course.booking_policies?.find((policy) => policy.is_active)
        const calculated = playDate ? calculateOpenDatetime(playDate, activePolicy) : null

        const detailParams = new URLSearchParams()
        if (playDate) detailParams.set('date', playDate)
        if (region) detailParams.set('region', region)
        const detailHref = `/courses/${course.slug}${detailParams.toString() ? `?${detailParams.toString()}` : ''}`

        return (
          <Card key={course.id} className="flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{course.name}</h3>
                <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-primary-muted px-3 py-1 text-xs font-semibold text-text">
                  {course.region_primary}
                  {course.region_secondary ? <span className="text-text-soft">/ {course.region_secondary}</span> : null}
                </div>
              </div>

              {calculated ? <ResultStatusBadge status={calculated.status} /> : null}
            </div>

            <div className="mt-4 grid gap-2 text-sm text-text-soft">
              {playDate ? <p className="m-0">희망 날짜: {playDate}</p> : null}
              <p className="m-0">회원권 필요: {course.membership_required ? '예' : '아니오'}</p>
              <p className="m-0">정책 타입: {activePolicy?.policy_type ?? '미정'}</p>
              <p className="m-0 leading-relaxed">정책 요약: {activePolicy?.policy_summary ?? course.booking_note ?? '요약 없음'}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-bg-soft px-4 py-4">
              <div className="text-xs font-semibold text-text-soft">예약 오픈 계산</div>
              <div className="mt-1 text-base font-extrabold leading-relaxed sm:text-lg">
                {calculated ? formatCalculatedResult(calculated) : '플레이 날짜를 입력해줘'}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {course.booking_url ? (
                <a href={course.booking_url} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full">예약 링크</Button>
                </a>
              ) : null}

              {course.map_url ? (
                <a href={course.map_url} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full" variant="secondary">
                    지도 링크
                  </Button>
                </a>
              ) : null}

              <a href={detailHref} className="w-full">
                <Button className="w-full" variant="secondary">
                  상세 보기
                </Button>
              </a>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
