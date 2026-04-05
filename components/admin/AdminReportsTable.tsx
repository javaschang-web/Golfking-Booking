'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type ReportRow = {
  id: string
  reporter_email: string | null
  report_type: string
  message: string
  status: string
  resolved_note: string | null
  created_at: string
  resolved_at: string | null
}

const statusOptions = ['new', 'reviewing', 'resolved', 'dismissed'] as const

export function AdminReportsTable() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('created_desc')

  async function load() {
    const supabase = getBrowserSupabaseClient()
    const { data, error } = await supabase
      .from('user_reports')
      .select('id, reporter_email, report_type, message, status, resolved_note, created_at, resolved_at')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setRows((data ?? []) as ReportRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(row: ReportRow, nextStatus: string) {
    setSavingId(row.id)
    setError(null)
    setSuccess(null)

    const supabase = getBrowserSupabaseClient()
    const payload: Record<string, string | null> = {
      status: nextStatus,
      resolved_at: nextStatus === 'resolved' || nextStatus === 'dismissed' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('user_reports').update(payload).eq('id', row.id)
    setSavingId(null)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'user_report',
      entityId: row.id,
      actionType: 'update_status',
      changedFields: payload,
      note: `제보 상태 변경: ${row.status} -> ${nextStatus}`,
    })

    setSuccess('제보 상태를 업데이트했어.')
    await load()
  }

  async function updateResolvedNote(row: ReportRow, note: string) {
    setSavingId(row.id)
    setError(null)
    setSuccess(null)

    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase
      .from('user_reports')
      .update({ resolved_note: note.trim() || null })
      .eq('id', row.id)

    setSavingId(null)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'user_report',
      entityId: row.id,
      actionType: 'update_note',
      changedFields: { resolved_note: note.trim() || null },
      note: '제보 처리 메모 수정',
    })

    setSuccess('처리 메모를 저장했어.')
    await load()
  }

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    const filtered = rows.filter((row) => {
      const matchesQuery =
        !keyword ||
        row.report_type.toLowerCase().includes(keyword) ||
        row.message.toLowerCase().includes(keyword) ||
        (row.reporter_email ?? '').toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      return matchesQuery && matchesStatus
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === 'resolved_desc') return (b.resolved_at ?? '').localeCompare(a.resolved_at ?? '')
      return b.created_at.localeCompare(a.created_at)
    })
  }, [rows, query, statusFilter, sortKey])

  const summary = useMemo(
    () => ({
      total: rows.length,
      visible: filteredRows.length,
      newCount: rows.filter((row) => row.status === 'new').length,
      reviewingCount: rows.filter((row) => row.status === 'reviewing').length,
    }),
    [rows, filteredRows]
  )

  if (loading) return <p className="text-sm text-text-soft">제보 목록 불러오는 중...</p>
  if (error) return <p className="text-sm font-semibold text-danger">불러오기 실패: {error}</p>
  if (rows.length === 0) return <p className="text-sm text-text-soft">들어온 제보가 아직 없어.</p>

  return (
    <div className="grid gap-4">
      {success ? <p className="m-0 text-sm font-semibold text-primary-strong">{success}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="전체" value={summary.total} />
        <SummaryCard label="현재 표시" value={summary.visible} />
        <SummaryCard label="new" value={summary.newCount} />
        <SummaryCard label="reviewing" value={summary.reviewingCount} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="유형 / 이메일 / 내용 검색" />

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">전체 상태</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="created_desc">최신 생성순</option>
          <option value="resolved_desc">최근 처리순</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-panel">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-text-soft">
              <th className="border-b border-border px-3 py-3 font-semibold">유형</th>
              <th className="border-b border-border px-3 py-3 font-semibold">상태</th>
              <th className="border-b border-border px-3 py-3 font-semibold">이메일</th>
              <th className="border-b border-border px-3 py-3 font-semibold">내용</th>
              <th className="border-b border-border px-3 py-3 font-semibold">처리 메모</th>
              <th className="border-b border-border px-3 py-3 font-semibold">생성일</th>
              <th className="border-b border-border px-3 py-3 font-semibold">처리일</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-panel-alt/40">
                <td className="border-b border-border px-3 py-3 font-medium text-text">{row.report_type}</td>
                <td className="border-b border-border px-3 py-3">
                  <Select
                    value={row.status}
                    disabled={savingId === row.id}
                    onChange={(e) => updateStatus(row, e.target.value)}
                    className="py-2"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.reporter_email ?? '-'}</td>
                <td className="border-b border-border px-3 py-3 text-text-soft">{row.message}</td>
                <td className="border-b border-border px-3 py-3">
                  <Textarea
                    defaultValue={row.resolved_note ?? ''}
                    rows={3}
                    className="min-h-[84px] w-64"
                    onBlur={(e) => updateResolvedNote(row, e.target.value)}
                  />
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  {new Date(row.created_at).toLocaleString('ko-KR')}
                </td>
                <td className="border-b border-border px-3 py-3 text-text-soft">
                  {row.resolved_at ? new Date(row.resolved_at).toLocaleString('ko-KR') : '-'}
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
