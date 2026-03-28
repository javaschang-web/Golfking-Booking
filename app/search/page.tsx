import { SearchForm } from '@/components/search/SearchForm'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { SearchSummary } from '@/components/search/SearchSummary'
import { calculateOpenDatetime } from '@/lib/booking-rules/calculate'
import { getPublicCourses } from '@/lib/queries/courses'
import { colors, ui } from '@/lib/design'

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
    <main style={ui.page}>
      <div style={ui.shell}>
        <section style={ui.hero}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={ui.badge}>검색 결과</div>
              <h2 style={{ marginBottom: 8 }}>지역 필터: {region || '전체'}</h2>
              <p style={{ margin: 0, color: colors.textSoft }}>원하는 날짜와 지역으로 결과를 다시 좁힐 수 있어.</p>
            </div>
            <a href="/" style={ui.link}>홈으로</a>
          </div>

          <div style={{ marginTop: 24 }}>
            <SearchForm initialDate={playDate} initialRegion={region} />
          </div>
        </section>

        <div style={{ marginTop: 24 }}>
          <SearchSummary total={courses.length} region={region} playDate={playDate} entries={calendarEntries} />
        </div>

        <div style={{ marginTop: 24 }}>
          <SearchResultsList courses={courses} playDate={playDate} region={region} />
        </div>
      </div>
    </main>
  )
}
