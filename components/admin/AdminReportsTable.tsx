'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

type ReportRow = {
  id: string
  reporter_email: string | null
  report_type: string
  message: string
  status: string
  created_at: string
}

export function AdminReportsTable() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase
        .from('user_reports')
        .select('id, reporter_email, report_type, message, status, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setRows((data ?? []) as ReportRow[])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p>제보 목록 불러오는 중...</p>
  if (error) return <p style={{ color: 'crimson' }}>불러오기 실패: {error}</p>
  if (rows.length === 0) return <p>들어온 제보가 아직 없어.</p>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={th}>유형</th>
            <th style={th}>상태</th>
            <th style={th}>이메일</th>
            <th style={th}>내용</th>
            <th style={th}>생성일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={td}>{row.report_type}</td>
              <td style={td}>{row.status}</td>
              <td style={td}>{row.reporter_email ?? '-'}</td>
              <td style={td}>{row.message}</td>
              <td style={td}>{new Date(row.created_at).toLocaleString('ko-KR')}</td>
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
  verticalAlign: 'top',
}
