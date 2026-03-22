import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseDetailView } from '@/components/search/CourseDetailView'
import { getPublicCourseDetail } from '@/lib/queries/course-detail'

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
    <main style={{ padding: 40, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <Link href="/">홈</Link>
        <Link href={backToSearch}>검색 결과</Link>
      </div>
      <CourseDetailView course={course} playDate={searchParams.date} />
    </main>
  )
}
