import Link from 'next/link'
import type { PublicCourseDetail } from '@/lib/queries/course-detail'
import { CourseOpenSummary } from '@/components/search/CourseOpenSummary'
import { DetailInfoGrid } from '@/components/search/DetailInfoGrid'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = {
  course: PublicCourseDetail
  playDate?: string
}

export function CourseDetailView({ course, playDate }: Props) {
  const activePolicies = course.booking_policies?.filter((policy) => policy.is_active) ?? []
  const activePolicy = activePolicies[0]
  const currentSources = course.source_records?.filter((record) => record.is_current) ?? []

  return (
    <div className="grid gap-6">
      <Card className="bg-gradient-to-br from-panel-alt to-panel shadow-hero">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-primary-muted px-3 py-1 text-xs font-semibold text-text">
          코스 상세
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{course.name}</h1>
            {course.english_name ? <p className="mt-2 text-sm text-text-soft">영문명: {course.english_name}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {course.homepage_url ? (
              <a href={course.homepage_url} target="_blank" rel="noreferrer">
                <Button variant="secondary">공식 홈페이지</Button>
              </a>
            ) : null}
            {course.booking_url ? (
              <a href={course.booking_url} target="_blank" rel="noreferrer">
                <Button>예약 링크</Button>
              </a>
            ) : null}
            {course.map_url ? (
              <a href={course.map_url} target="_blank" rel="noreferrer">
                <Button variant="secondary">지도 링크</Button>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <DetailInfoGrid course={course} />
        </div>

        {course.membership_note ? (
          <p className="mt-4 text-sm text-text-soft">회원 메모: {course.membership_note}</p>
        ) : null}
        {course.booking_note ? <p className="mt-2 text-sm text-text-soft">부킹 메모: {course.booking_note}</p> : null}
      </Card>

      <CourseOpenSummary playDate={playDate} policy={activePolicy} />

      <Card>
        <h2 className="text-lg font-semibold">활성 예약 정책</h2>
        {activePolicies.length === 0 ? <p className="mt-2 text-sm text-text-soft">활성 정책이 아직 없어.</p> : null}

        <div className="mt-3 grid gap-3">
          {activePolicies.map((policy) => (
            <div key={policy.id} className="rounded-2xl border border-border bg-bg-soft px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">{policy.policy_type}</strong>
                {policy.policy_summary ? (
                  <span className="text-xs font-semibold text-text-soft">{policy.policy_summary}</span>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2 text-sm text-text-soft">
                {policy.source_text ? <p className="m-0">원문: {policy.source_text}</p> : null}
                {policy.open_time ? <p className="m-0">오픈 시간: {policy.open_time}</p> : null}
                {policy.days_before_open != null ? <p className="m-0">며칠 전 오픈: {policy.days_before_open}</p> : null}
                {policy.open_weekday != null ? <p className="m-0">오픈 요일: {policy.open_weekday}</p> : null}
                {policy.monthly_open_day != null ? <p className="m-0">월간 오픈 일자: {policy.monthly_open_day}</p> : null}
                {policy.manual_open_datetime ? (
                  <p className="m-0">수동 오픈 시각: {new Date(policy.manual_open_datetime).toLocaleString('ko-KR')}</p>
                ) : null}
                {policy.note ? <p className="m-0">운영 메모: {policy.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">현재 출처 기록</h2>
        {currentSources.length === 0 ? <p className="mt-2 text-sm text-text-soft">현재 표시할 출처가 없어.</p> : null}

        <div className="mt-3 grid gap-3">
          {currentSources.map((record) => (
            <div key={record.id} className="rounded-2xl border border-border bg-bg-soft px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">{record.source_type}</strong>
                <span className="text-xs font-semibold text-text-soft">
                  확인일: {new Date(record.checked_at).toLocaleString('ko-KR')}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-text-soft">
                {record.source_title ? <p className="m-0">제목: {record.source_title}</p> : null}
                {record.source_url ? (
                  <p className="m-0">
                    <a href={record.source_url} target="_blank" rel="noreferrer" className="font-semibold text-primary-strong hover:underline">
                      출처 링크 열기
                    </a>
                  </p>
                ) : null}
                {record.captured_text ? <p className="m-0">원문: {record.captured_text}</p> : null}
                {record.note ? <p className="m-0">메모: {record.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">다음 행동</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/search" className="w-full sm:w-auto">
            <Button className="w-full" variant="secondary">
              검색으로 돌아가기
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full" variant="secondary">
              홈으로 이동
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
