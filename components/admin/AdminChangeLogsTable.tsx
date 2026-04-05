'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { Select } from '@/components/ui/select'

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

  if (loading) return <p className="text-sm text-text-soft">변경 이력 불러오는 중...</p>
  if (error) return <p className="text-sm font-semibold text-danger">불러오기 실패: {error}</p>
  if (rows.length === 0) return <p className="text-sm text-text-soft">아직 기록된 변경 이력이 없어.</p>

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="전체 로그" value={summary.total} />
        <SummaryCard label="현재 필터 결과" value={summary.visible} />
        <SummaryCard label="엔티티 종류" value={summary.entities} />
        <SummaryCard label="액션 종류" value={summary.actions} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          {entityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          {actionOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-panel">
        <table className="min-w-[1100px] w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-text-soft">
              <th className="border-b border-border px-3 py-3 font-semibold">시각</th>
              <th className="border-b border-border px-3 py-3 font-semibold">엔티티</th>
              <th className="border-b border-border px-3 py-3 font-semibold">액션</th>
              <th className="border-b border-border px-3 py-3 font-semibold">대상 ID</th>
              <th className="border-b border-border px-3 py-3 font-semibold">Actor</th>
              <th className="border-b border-border px-3 py-3 font-semibold">변경 필드</th>
              <th className="border-b border-border px-3 py-3 font-semibold">메모</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-panel-alt/40">
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  {new Date(row.created_at).toLocaleString('ko-KR')}
                </td>
                <td className="border-b border-border px-3 py-3 font-medium text-text">{row.entity_type}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.action_type}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  <code className="text-xs">{row.entity_id}</code>
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  <code className="text-xs">{row.actor_id ?? '-'}</code>
                </td>
                <td className="border-b border-border px-3 py-3">
                  <pre className="m-0 max-w-[520px] whitespace-pre-wrap break-words text-xs text-text-soft">
                    {row.changed_fields ? JSON.stringify(row.changed_fields, null, 2) : '-'}
                  </pre>
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.note ?? '-'}</td>
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
