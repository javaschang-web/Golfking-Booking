'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

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

  if (loading) return <p>골프장 목록 불러오는 중...</p>
  if (error) return <p style={{ color: 'crimson' }}>불러오기 실패: {error}</p>
  if (rows.length === 0) return <p>등록된 골프장이 아직 없어.</p>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 / 슬러그 / 지역 검색"
          style={{ padding: 10, minWidth: 260 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 10 }}>
          <option value="all">전체 상태</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="seasonal_closed">seasonal_closed</option>
          <option value="maintenance">maintenance</option>
        </select>
        <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} style={{ padding: 10 }}>
          <option value="all">전체 검수 상태</option>
          <option value="draft">draft</option>
          <option value="verified">verified</option>
          <option value="needs_review">needs_review</option>
          <option value="hidden">hidden</option>
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ padding: 10 }}>
          <option value="created_desc">기본 정렬</option>
          <option value="name_asc">이름순</option>
          <option value="verified_desc">최근 확인일순</option>
        </select>
      </div>

      <div style={{ fontSize: 14, color: '#666' }}>표시 중: {filteredRows.length} / 전체 {rows.length}</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th style={th}>이름</th>
              <th style={th}>슬러그</th>
              <th style={th}>지역</th>
              <th style={th}>상태</th>
              <th style={th}>검수</th>
              <th style={th}>최근 확인</th>
              <th style={th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.name}</td>
                <td style={td}>{row.slug}</td>
                <td style={td}>{[row.region_primary, row.region_secondary].filter(Boolean).join(' / ')}</td>
                <td style={td}>{row.status}</td>
                <td style={td}>{row.verification_status}</td>
                <td style={td}>{row.last_verified_at ? new Date(row.last_verified_at).toLocaleString('ko-KR') : '-'}</td>
                <td style={td}>
                  <Link href={`/admin/courses/${row.id}`}>수정</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '10px 8px',
  background: '#fafafa',
}

const td: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '10px 8px',
}
