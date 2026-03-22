'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

  if (loading) return <p>골프장 목록 불러오는 중...</p>
  if (error) return <p style={{ color: 'crimson' }}>불러오기 실패: {error}</p>
  if (rows.length === 0) return <p>등록된 골프장이 아직 없어.</p>

  return (
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
          {rows.map((row) => (
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
