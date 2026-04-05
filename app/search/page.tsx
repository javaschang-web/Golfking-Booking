import { SearchForm } from '@/components/search/SearchForm'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { SearchSummary } from '@/components/search/SearchSummary'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { calculateOpenDatetime } from '@/lib/booking-rules/calculate'
import { getPublicCourses } from '@/lib/queries/courses'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { date?: string; region?: string }
}) {
  const playDate = searchParams.date ?? ''
  const region = searchParams.region ?? ''
  const courses = await getPublicCourses(region)

  const groupedOpenDates = playDate
    ? courses.reduce<Record<string, { label: string; names: string[] }>>((acc, course) => {
        const activePolicy = course.booking_policies?.find((policy) => policy.is_active)
        const calculated = calculateOpenDatetime(playDate, activePolicy)

        if (calculated.status !== 'ok' || !calculated.openDatetime) {
          return acc
        }

        const openDate = new Date(calculated.openDatetime)
        const dateKey = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(openDate)

        const label = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        }).format(openDate)

        if (!acc[dateKey]) {
          acc[dateKey] = { label, names: [] }
        }

        acc[dateKey].names.push(course.name)
        return acc
      }, {})
    : {}

  const calendarEntries = Object.entries(groupedOpenDates)
    .map(([dateKey, value]) => ({
      dateKey,
      label: value.label,
      count: value.names.length,
      names: value.names.sort((a, b) => a.localeCompare(b, 'ko-KR')),
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  return (
    <main>
      <Container>
        <Card className="bg-gradient-to-br from-panel-alt to-panel shadow-hero">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-primary-muted px-3 py-1 text-xs font-semibold text-text">
                검색 결과
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                지역 필터: <span className="text-primary-strong">{region || '전체'}</span>
              </h1>
              <p className="mt-2 text-sm text-text-soft">원하는 날짜와 지역으로 결과를 다시 좁힐 수 있어.</p>
            </div>

            <a href="/" className="text-sm font-semibold text-primary-strong hover:underline">
              홈으로
            </a>
          </div>

          <div className="mt-6">
            <SearchForm initialDate={playDate} initialRegion={region} />
          </div>
        </Card>

        <div className="mt-6">
          <SearchSummary total={courses.length} region={region} playDate={playDate} entries={calendarEntries} />
        </div>

        <div className="mt-6">
          <SearchResultsList courses={courses} playDate={playDate} region={region} />
        </div>
      </Container>
    </main>
  )
}
