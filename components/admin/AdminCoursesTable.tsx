'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type CourseRow = {
  id: string
  slug: string
  name: string
  region_primary: string
  region_secondary: string | null
  verification_status: string
  status: string
  last_verified_at: string | null
  // derived
  policy_filled?: boolean
  source_count?: number
}

type PolicyRow = {
  id: string
  golf_course_id: string
  policy_type: string
  is_active: boolean
  days_before_open: number | null
  open_time: string | null
  open_weekday: number | null
}

type SourceRow = {
  id: string
  golf_course_id: string
  is_current: boolean
}

export function AdminCoursesTable() {
  const [rows, setRows] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [onlyNeedsPolicy, setOnlyNeedsPolicy] = useState(false)
  const [sortKey, setSortKey] = useState<'needs_policy_first' | 'name_asc' | 'verified_desc'>('needs_policy_first')

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()

      // 1) Base course list
      const { data: courseData, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, slug, name, region_primary, region_secondary, verification_status, status, last_verified_at')
        .order('created_at', { ascending: false })

      if (courseError) {
        setError(courseError.message)
        setLoading(false)
        return
      }

      const courses = (courseData ?? []) as CourseRow[]
      const ids = courses.map((c) => c.id)

      if (ids.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      // 2) Policies (active only) for "policy_filled" computation
      const { data: policyData, error: policyError } = await supabase
        .from('booking_policies')
        .select('id, golf_course_id, policy_type, is_active, days_before_open, open_time, open_weekday')
        .in('golf_course_id', ids)
        .eq('is_active', true)

      if (policyError) {
        setError(policyError.message)
        setLoading(false)
        return
      }

      const policies = (policyData ?? []) as PolicyRow[]
      const policyByCourse = new Map<string, PolicyRow[]>()
      for (const p of policies) {
        const list = policyByCourse.get(p.golf_course_id) ?? []
        list.push(p)
        policyByCourse.set(p.golf_course_id, list)
      }

      // 3) Current sources count
      const { data: sourceData, error: sourceError } = await supabase
        .from('source_records')
        .select('id, golf_course_id, is_current')
        .in('golf_course_id', ids)
        .eq('is_current', true)

      if (sourceError) {
        setError(sourceError.message)
        setLoading(false)
        return
      }

      const sources = (sourceData ?? []) as SourceRow[]
      const sourceCountByCourse = new Map<string, number>()
      for (const s of sources) {
        sourceCountByCourse.set(s.golf_course_id, (sourceCountByCourse.get(s.golf_course_id) ?? 0) + 1)
      }

      const enriched = courses.map((c) => {
        const active = policyByCourse.get(c.id) ?? []
        const hasFilled = active.some((p) => {
          // Treat as "calculation-ready" if any key fields exist.
          // (days_before policy needs days_before_open + open_time; weekday rules may have open_weekday etc.)
          return p.days_before_open != null || Boolean(p.open_time) || p.open_weekday != null
        })

        return {
          ...c,
          policy_filled: hasFilled,
          source_count: sourceCountByCourse.get(c.id) ?? 0,
        }
      })

      setRows(enriched)
      setLoading(false)
    }

    load()
  }, [])

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    const filtered = rows.filter((row) => {
      const matchesQuery =
        !keyword ||
        row.name.toLowerCase().includes(keyword) ||
        row.slug.toLowerCase().includes(keyword) ||
        row.region_primary.toLowerCase().includes(keyword) ||
        (row.region_secondary ?? '').toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesVerification = verificationFilter === 'all' || row.verification_status === verificationFilter
      const matchesNeedsPolicy = !onlyNeedsPolicy || row.policy_filled === false

      return matchesQuery && matchesStatus && matchesVerification && matchesNeedsPolicy
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name, 'ko')
      if (sortKey === 'verified_desc') return (b.last_verified_at ?? '').localeCompare(a.last_verified_at ?? '')

      // needs_policy_first
      const aScore = a.policy_filled ? 1 : 0
      const bScore = b.policy_filled ? 1 : 0
      if (aScore !== bScore) return aScore - bScore
      // then fewer sources first (more urgent)
      const aSources = a.source_count ?? 0
      const bSources = b.source_count ?? 0
      if (aSources !== bSources) return aSources - bSources
      return a.name.localeCompare(b.name, 'ko')
    })
  }, [rows, query, statusFilter, verificationFilter, onlyNeedsPolicy, sortKey])

  const summary = useMemo(
    () => ({
      total: rows.length,
      visible: filteredRows.length,
      verified: rows.filter((row) => row.verification_status === 'verified').length,
      needsReview: rows.filter((row) => row.verification_status === 'needs_review').length,
      policyReady: rows.filter((row) => row.policy_filled).length,
      policyMissing: rows.filter((row) => row.policy_filled === false).length,
    }),
    [rows, filteredRows]
  )

  if (loading) return <p className="text-sm text-text-soft">골프장 목록 불러오는 중...</p>
  if (error) return <p className="text-sm font-semibold text-danger">불러오기 실패: {error}</p>
  if (rows.length === 0) return <p className="text-sm text-text-soft">등록된 골프장이 아직 없어.</p>

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <SummaryCard label="전체" value={summary.total} />
        <SummaryCard label="현재 표시" value={summary.visible} />
        <SummaryCard label="verified" value={summary.verified} />
        <SummaryCard label="needs_review" value={summary.needsReview} />
        <SummaryCard label="계산 가능" value={summary.policyReady} />
        <SummaryCard label="정책 미확정" value={summary.policyMissing} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_140px_160px_160px_180px]">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 / 슬러그 / 지역 검색" />

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">전체 상태</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="seasonal_closed">seasonal_closed</option>
          <option value="maintenance">maintenance</option>
        </Select>

        <Select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
          <option value="all">전체 검수</option>
          <option value="draft">draft</option>
          <option value="verified">verified</option>
          <option value="needs_review">needs_review</option>
          <option value="hidden">hidden</option>
        </Select>

        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
          <option value="needs_policy_first">미확정 우선</option>
          <option value="name_asc">이름순</option>
          <option value="verified_desc">최근 확인일순</option>
        </Select>

        <label className="flex items-center gap-2 rounded-2xl border border-border bg-bg-soft px-4 py-3 text-sm text-text-soft">
          <input type="checkbox" checked={onlyNeedsPolicy} onChange={(e) => setOnlyNeedsPolicy(e.target.checked)} />
          정책 미확정만 보기
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-panel">
        <table className="min-w-[1060px] w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-text-soft">
              <th className="border-b border-border px-3 py-3 font-semibold">이름</th>
              <th className="border-b border-border px-3 py-3 font-semibold">슬러그</th>
              <th className="border-b border-border px-3 py-3 font-semibold">지역</th>
              <th className="border-b border-border px-3 py-3 font-semibold">상태</th>
              <th className="border-b border-border px-3 py-3 font-semibold">검수</th>
              <th className="border-b border-border px-3 py-3 font-semibold">정책</th>
              <th className="border-b border-border px-3 py-3 font-semibold">출처</th>
              <th className="border-b border-border px-3 py-3 font-semibold">최근 확인</th>
              <th className="border-b border-border px-3 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-panel-alt/40">
                <td className="border-b border-border px-3 py-3 font-medium text-text">{row.name}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.slug}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  {[row.region_primary, row.region_secondary].filter(Boolean).join(' / ')}
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.status}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.verification_status}</td>
                <td className="border-b border-border px-3 py-3">
                  {row.policy_filled ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-[#123622] px-3 py-1 text-xs font-bold text-[#92f2a4]">
                      계산 가능
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-[#6b5a1e] bg-[#3f3614] px-3 py-1 text-xs font-bold text-[#ffd86b]">
                      미확정
                    </span>
                  )}
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.source_count ?? 0}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  {row.last_verified_at ? new Date(row.last_verified_at).toLocaleString('ko-KR') : '-'}
                </td>
                <td className="border-b border-border px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/courses/${row.id}`} className="inline-block">
                      <Button variant="secondary" className="py-2">
                        수정
                      </Button>
                    </Link>
                    <a href={`/courses/${row.slug}`} target="_blank" rel="noreferrer" className="inline-block">
                      <Button variant="secondary" className="py-2">
                        공개 보기
                      </Button>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3">
      <div className="text-xs font-semibold text-text-soft">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-text">{value}</div>
    </div>
  )
}
