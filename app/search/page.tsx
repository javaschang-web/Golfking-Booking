import { SearchForm } from '@/components/search/SearchForm'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { SearchSummary } from '@/components/search/SearchSummary'
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
          <SearchSummary total={courses.length} region={region} playDate={playDate} />
        </div>

        <div style={{ marginTop: 24 }}>
          <SearchResultsList courses={courses} playDate={playDate} region={region} />
        </div>
      </div>
    </main>
  )
}
