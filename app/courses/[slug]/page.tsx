import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseDetailView } from '@/components/search/CourseDetailView'
import { getPublicCourseDetail } from '@/lib/queries/course-detail'
import { ui } from '@/lib/design'

type Props = {
  params: { slug: string }
  searchParams: { date?: string; region?: string }
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const course = await getPublicCourseDetail(params.slug)

  if (!course) {
    notFound()
  }

  const qs = new URLSearchParams()
  if (searchParams.date) qs.set('date', searchParams.date)
  if (searchParams.region) qs.set('region', searchParams.region)
  const backToSearch = `/search${qs.toString() ? `?${qs.toString()}` : ''}`

  return (
    <main style={ui.page}>
      <div style={ui.shell}>
        <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={ui.link}>홈</Link>
          <Link href={backToSearch} style={ui.link}>검색 결과</Link>
        </div>
        <CourseDetailView course={course} playDate={searchParams.date} />
      </div>
    </main>
  )
}
