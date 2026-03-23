'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

export function AdminOpsSummary() {
  const [stats, setStats] = useState({
    courses: 0,
    verified: 0,
    reportsNew: 0,
    logs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const [courses, reports, logs] = await Promise.all([
        supabase.from('golf_courses').select('id, verification_status'),
        supabase.from('user_reports').select('id, status'),
        supabase.from('change_logs').select('id').limit(100),
      ])

      setStats({
        courses: courses.data?.length ?? 0,
        verified: courses.data?.filter((row: any) => row.verification_status === 'verified').length ?? 0,
        reportsNew: reports.data?.filter((row: any) => row.status === 'new').length ?? 0,
        logs: logs.data?.length ?? 0,
      })
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p>운영 현황 불러오는 중...</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      <Card label="전체 골프장" value={stats.courses} />
      <Card label="검수 완료" value={stats.verified} />
      <Card label="신규 제보" value={stats.reportsNew} />
      <Card label="최근 로그" value={stats.logs} />
    </div>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
