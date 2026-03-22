import { SearchForm } from '@/components/search/SearchForm'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { SearchSummary } from '@/components/search/SearchSummary'
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

  return (
    <main style={{ padding: 40, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h2>검색 결과</h2>
          <p style={{ margin: 0 }}>지역 필터: {region || '전체'}</p>
        </div>
        <a href="/">홈으로</a>
      </div>

      <div style={{ marginTop: 24 }}>
        <SearchForm initialDate={playDate} initialRegion={region} />
      </div>

      <div style={{ marginTop: 24 }}>
        <SearchSummary total={courses.length} region={region} playDate={playDate} />
      </div>

      <div style={{ marginTop: 32 }}>
        <SearchResultsList courses={courses} playDate={playDate} region={region} />
      </div>
    </main>
  )
}
