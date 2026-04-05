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
}

export function AdminCoursesTable() {
  const [rows, setRows] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [sortKey, setSortKey] = useState('created_desc')

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, slug, name, region_primary, region_secondary, verification_status, status, last_verified_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setRows((data ?? []) as CourseRow[])
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

      return matchesQuery && matchesStatus && matchesVerification
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name, 'ko')
      if (sortKey === 'verified_desc') return (b.last_verified_at ?? '').localeCompare(a.last_verified_at ?? '')
      return 0
    })
  }, [rows, query, statusFilter, verificationFilter, sortKey])

  const summary = useMemo(
    () => ({
      total: rows.length,
      visible: filteredRows.length,
      verified: rows.filter((row) => row.verification_status === 'verified').length,
      needsReview: rows.filter((row) => row.verification_status === 'needs_review').length,
    }),
    [rows, filteredRows]
  )

  if (loading) return <p className="text-sm text-text-soft">골프장 목록 불러오는 중...</p>
  if (error) return <p className="text-sm font-semibold text-danger">불러오기 실패: {error}</p>
  if (rows.length === 0) return <p className="text-sm text-text-soft">등록된 골프장이 아직 없어.</p>

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="전체" value={summary.total} />
        <SummaryCard label="현재 표시" value={summary.visible} />
        <SummaryCard label="verified" value={summary.verified} />
        <SummaryCard label="needs_review" value={summary.needsReview} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_140px_160px_160px]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 / 슬러그 / 지역 검색"
        />

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

        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="created_desc">기본 정렬</option>
          <option value="name_asc">이름순</option>
          <option value="verified_desc">최근 확인일순</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-panel">
        <table className="min-w-[880px] w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-text-soft">
              <th className="border-b border-border px-3 py-3 font-semibold">이름</th>
              <th className="border-b border-border px-3 py-3 font-semibold">슬러그</th>
              <th className="border-b border-border px-3 py-3 font-semibold">지역</th>
              <th className="border-b border-border px-3 py-3 font-semibold">상태</th>
              <th className="border-b border-border px-3 py-3 font-semibold">검수</th>
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
