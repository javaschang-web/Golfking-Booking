import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseDetailView } from '@/components/search/CourseDetailView'
import { getPublicCourseDetail } from '@/lib/queries/course-detail'
import { Container } from '@/components/ui/container'

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
    <main>
      <Container>
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/" className="font-semibold text-primary-strong hover:underline">
            홈
          </Link>
          <span className="text-text-soft">/</span>
          <Link href={backToSearch} className="font-semibold text-primary-strong hover:underline">
            검색 결과
          </Link>
        </div>
        <CourseDetailView course={course} playDate={searchParams.date} />
      </Container>
    </main>
  )
}
