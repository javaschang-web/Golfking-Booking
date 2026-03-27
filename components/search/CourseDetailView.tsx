import Link from 'next/link'
import type { PublicCourseDetail } from '@/lib/queries/course-detail'
import { CourseOpenSummary } from '@/components/search/CourseOpenSummary'
import { DetailInfoGrid } from '@/components/search/DetailInfoGrid'
import { colors, ui } from '@/lib/design'

type Props = {
  course: PublicCourseDetail
  playDate?: string
}

export function CourseDetailView({ course, playDate }: Props) {
  const activePolicies = course.booking_policies?.filter((policy) => policy.is_active) ?? []
  const activePolicy = activePolicies[0]
  const currentSources = course.source_records?.filter((record) => record.is_current) ?? []

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section style={ui.hero}>
        <div style={{ ...ui.badge, width: 'fit-content', marginBottom: 12 }}>코스 상세</div>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 36 }}>{course.name}</h1>
        {course.english_name ? <p style={p}>영문명: {course.english_name}</p> : null}
        <DetailInfoGrid course={course} />
        {course.membership_note ? <p style={{ ...p, marginTop: 16 }}>회원 메모: {course.membership_note}</p> : null}
        {course.booking_note ? <p style={p}>부킹 메모: {course.booking_note}</p> : null}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {course.homepage_url ? <a href={course.homepage_url} target="_blank" rel="noreferrer" style={ui.link}>공식 홈페이지</a> : null}
          {course.booking_url ? <a href={course.booking_url} target="_blank" rel="noreferrer" style={ui.link}>예약 링크</a> : null}
          {course.map_url ? <a href={course.map_url} target="_blank" rel="noreferrer" style={ui.link}>지도 링크</a> : null}
        </div>
      </section>

      <CourseOpenSummary playDate={playDate} policy={activePolicy} />

      <section style={ui.card}>
        <h2 style={h2}>활성 예약 정책</h2>
        {activePolicies.length === 0 ? <p style={p}>활성 정책이 아직 없어.</p> : null}
        {activePolicies.map((policy) => (
          <div key={policy.id} style={{ ...ui.subCard, marginTop: 12 }}>
            <strong>{policy.policy_type}</strong>
            <p style={p}>요약: {policy.policy_summary ?? '-'}</p>
            {policy.source_text ? <p style={p}>원문: {policy.source_text}</p> : null}
            {policy.open_time ? <p style={p}>오픈 시간: {policy.open_time}</p> : null}
            {policy.days_before_open != null ? <p style={p}>며칠 전 오픈: {policy.days_before_open}</p> : null}
            {policy.open_weekday != null ? <p style={p}>오픈 요일: {policy.open_weekday}</p> : null}
            {policy.monthly_open_day != null ? <p style={p}>월 오픈 일자: {policy.monthly_open_day}</p> : null}
            {policy.manual_open_datetime ? <p style={p}>수동 오픈 시각: {new Date(policy.manual_open_datetime).toLocaleString('ko-KR')}</p> : null}
            {policy.note ? <p style={p}>운영 메모: {policy.note}</p> : null}
          </div>
        ))}
      </section>

      <section style={ui.card}>
        <h2 style={h2}>현재 출처 기록</h2>
        {currentSources.length === 0 ? <p style={p}>현재 표시할 출처가 없어.</p> : null}
        {currentSources.map((record) => (
          <div key={record.id} style={{ ...ui.subCard, marginTop: 12 }}>
            <strong>{record.source_type}</strong>
            {record.source_title ? <p style={p}>제목: {record.source_title}</p> : null}
            {record.source_url ? <p style={p}><a href={record.source_url} target="_blank" rel="noreferrer" style={ui.link}>출처 링크 열기</a></p> : null}
            {record.captured_text ? <p style={p}>원문: {record.captured_text}</p> : null}
            <p style={p}>확인일: {new Date(record.checked_at).toLocaleString('ko-KR')}</p>
            {record.note ? <p style={p}>메모: {record.note}</p> : null}
          </div>
        ))}
      </section>

      <section style={ui.card}>
        <h2 style={h2}>다음 이동</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/search" style={ui.link}>검색으로 돌아가기</Link>
          <Link href="/" style={ui.link}>홈으로 이동</Link>
        </div>
      </section>
    </div>
  )
}

const p: React.CSSProperties = {
  margin: '8px 0',
  color: colors.textSoft,
}

const h2: React.CSSProperties = {
  marginTop: 0,
}
