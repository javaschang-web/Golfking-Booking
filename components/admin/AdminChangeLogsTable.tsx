'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { colors, ui } from '@/lib/design'

type ChangeLogRow = {
  id: string
  entity_type: string
  entity_id: string
  action_type: string
  changed_fields: Record<string, unknown> | null
  actor_id: string | null
  note: string | null
  created_at: string
}

export function AdminChangeLogsTable() {
  const [rows, setRows] = useState<ChangeLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase
        .from('change_logs')
        .select('id, entity_type, entity_id, action_type, changed_fields, actor_id, note, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setRows((data ?? []) as ChangeLogRow[])
      setLoading(false)
    }

    load()
  }, [])

  const entityOptions = useMemo(() => ['all', ...Array.from(new Set(rows.map((row) => row.entity_type)))], [rows])
  const actionOptions = useMemo(() => ['all', ...Array.from(new Set(rows.map((row) => row.action_type)))], [rows])

  const filteredRows = rows.filter((row) => {
    const entityOk = entityFilter === 'all' || row.entity_type === entityFilter
    const actionOk = actionFilter === 'all' || row.action_type === actionFilter
    return entityOk && actionOk
  })

  const summary = useMemo(() => {
    return {
      total: rows.length,
      visible: filteredRows.length,
      entities: entityOptions.length - 1,
      actions: actionOptions.length - 1,
    }
  }, [rows.length, filteredRows.length, entityOptions.length, actionOptions.length])

  if (loading) return <p>변경 이력 불러오는 중...</p>
  if (error) return <p style={{ color: colors.danger }}>불러오기 실패: {error}</p>
  if (rows.length === 0) return <p>아직 기록된 변경 이력이 없어.</p>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <SummaryCard label="전체 로그" value={summary.total} />
        <SummaryCard label="현재 필터 결과" value={summary.visible} />
        <SummaryCard label="엔티티 종류" value={summary.entities} />
        <SummaryCard label="액션 종류" value={summary.actions} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={ui.input}>
          {entityOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={ui.input}>
          {actionOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: 'auto', ...ui.card }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>시각</th>
              <th style={th}>엔티티</th>
              <th style={th}>액션</th>
              <th style={th}>대상 ID</th>
              <th style={th}>Actor</th>
              <th style={th}>변경 필드</th>
              <th style={th}>메모</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td style={td}>{new Date(row.created_at).toLocaleString('ko-KR')}</td>
                <td style={td}>{row.entity_type}</td>
                <td style={td}>{row.action_type}</td>
                <td style={td}><code>{row.entity_id}</code></td>
                <td style={td}><code>{row.actor_id ?? '-'}</code></td>
                <td style={td}><pre style={pre}>{row.changed_fields ? JSON.stringify(row.changed_fields, null, 2) : '-'}</pre></td>
                <td style={td}>{row.note ?? '-'}</td>
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
    <div style={ui.subCard}>
      <div style={{ fontSize: 12, color: colors.textSoft }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 20 }}>{value}</div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: `1px solid ${colors.border}`,
  padding: '10px 8px',
  color: colors.textSoft,
  verticalAlign: 'top',
}

const td: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
  padding: '10px 8px',
  verticalAlign: 'top',
}

const pre: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: 12,
  color: colors.textSoft,
}
