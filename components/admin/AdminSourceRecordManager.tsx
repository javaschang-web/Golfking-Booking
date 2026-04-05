'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type PolicyOption = {
  id: string
  policy_type: string
  policy_summary: string | null
}

type SourceRow = {
  id: string
  source_type: string
  source_url: string | null
  source_title: string | null
  captured_text: string | null
  checked_at: string
  is_current: boolean
  note: string | null
  booking_policy_id: string | null
}

type SourceForm = {
  source_type: string
  source_url: string
  source_title: string
  captured_text: string
  booking_policy_id: string
  is_current: boolean
  note: string
}

const initialForm: SourceForm = {
  source_type: 'homepage',
  source_url: '',
  source_title: '',
  captured_text: '',
  booking_policy_id: '',
  is_current: true,
  note: '',
}

export function AdminSourceRecordManager({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<SourceRow[]>([])
  const [policies, setPolicies] = useState<PolicyOption[]>([])
  const [form, setForm] = useState<SourceForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(form.source_type.trim())
  }, [form])

  async function load() {
    const supabase = getBrowserSupabaseClient()
    const [{ data: sourceData, error: sourceError }, { data: policyData, error: policyError }] = await Promise.all([
      supabase
        .from('source_records')
        .select('id, source_type, source_url, source_title, captured_text, checked_at, is_current, note, booking_policy_id')
        .eq('golf_course_id', courseId)
        .order('checked_at', { ascending: false }),
      supabase
        .from('booking_policies')
        .select('id, policy_type, policy_summary')
        .eq('golf_course_id', courseId)
        .order('created_at', { ascending: false }),
    ])

    if (sourceError || policyError) {
      setError(sourceError?.message ?? policyError?.message ?? '불러오기 실패')
      setLoading(false)
      return
    }

    setRows((sourceData ?? []) as SourceRow[])
    setPolicies((policyData ?? []) as PolicyOption[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [courseId])

  function update<K extends keyof SourceForm>(key: K, value: SourceForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      golf_course_id: courseId,
      booking_policy_id: emptyToNull(form.booking_policy_id),
      source_type: form.source_type,
      source_url: emptyToNull(form.source_url),
      source_title: emptyToNull(form.source_title),
      captured_text: emptyToNull(form.captured_text),
      is_current: form.is_current,
      note: emptyToNull(form.note),
    }

    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase.from('source_records').insert(payload)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'source_record',
      entityId: courseId,
      actionType: 'create',
      changedFields: payload,
      note: '출처 기록 추가',
    })

    setForm(initialForm)
    setSuccess('출처 기록을 추가했어.')
    await load()
  }

  async function toggleCurrent(row: SourceRow) {
    setError(null)
    setSuccess(null)

    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase.from('source_records').update({ is_current: !row.is_current }).eq('id', row.id)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'source_record',
      entityId: row.id,
      actionType: 'toggle_current',
      changedFields: { is_current: !row.is_current },
      note: row.is_current ? '출처 현재 상태 해제' : '출처 현재 상태 지정',
    })

    setSuccess('출처 현재 상태를 변경했어.')
    await load()
  }

  return (
    <section className="grid gap-5">
      <div>
        <h3 className="text-base font-semibold">출처 / 검수 기록</h3>
        <p className="mt-1 text-sm text-text-soft">정책의 출처 링크와 원문을 관리할 수 있어.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="출처 타입 *">
              <Select value={form.source_type} onChange={(e) => update('source_type', e.target.value)}>
                <option value="manual">manual</option>
                <option value="homepage">homepage</option>
                <option value="reservation_page">reservation_page</option>
                <option value="notice_page">notice_page</option>
                <option value="phone_confirmed">phone_confirmed</option>
                <option value="user_report">user_report</option>
                <option value="crawler">crawler</option>
              </Select>
            </Field>

            <Field label="연결 정책">
              <Select value={form.booking_policy_id} onChange={(e) => update('booking_policy_id', e.target.value)}>
                <option value="">정책 미연결</option>
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policy_type} {policy.policy_summary ? `- ${policy.policy_summary}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="출처 URL">
              <Input value={form.source_url} onChange={(e) => update('source_url', e.target.value)} />
            </Field>
            <Field label="출처 제목">
              <Input value={form.source_title} onChange={(e) => update('source_title', e.target.value)} />
            </Field>
          </div>

          <Field label="캡처 원문">
            <Textarea value={form.captured_text} onChange={(e) => update('captured_text', e.target.value)} rows={5} />
          </Field>

          <Field label="메모">
            <Textarea value={form.note} onChange={(e) => update('note', e.target.value)} rows={3} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-text-soft">
            <input type="checkbox" checked={form.is_current} onChange={(e) => update('is_current', e.target.checked)} />
            현재 유효한 출처로 표시
          </label>

          {error ? <p className="m-0 text-sm font-semibold text-danger">{error}</p> : null}
          {success ? <p className="m-0 text-sm font-semibold text-primary-strong">{success}</p> : null}

          <Button type="submit" disabled={!canSubmit || saving} className="w-full sm:w-56">
            {saving ? '저장 중...' : '출처 기록 추가'}
          </Button>
        </form>
      </Card>

      <Card>
        <div>
          <h3 className="text-base font-semibold">등록된 출처 기록</h3>
          <p className="mt-1 text-sm text-text-soft">현재 여부를 토글해서 최신 출처를 관리해.</p>
        </div>

        {loading ? <p className="mt-3 text-sm text-text-soft">출처 기록 불러오는 중...</p> : null}
        {!loading && rows.length === 0 ? <p className="mt-3 text-sm text-text-soft">등록된 출처 기록이 아직 없어.</p> : null}

        {!loading && rows.length > 0 ? (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-panel">
            <table className="min-w-[860px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-text-soft">
                  <th className="border-b border-border px-3 py-3 font-semibold">타입</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">제목</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">URL</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">현재</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">확인일</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-panel-alt/40">
                    <td className="border-b border-border px-3 py-3 font-medium text-text">{row.source_type}</td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">{row.source_title ?? '-'}</td>
                    <td className="border-b border-border px-3 py-3">
                      {row.source_url ? (
                        <a
                          href={row.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-primary-strong hover:underline"
                        >
                          열기
                        </a>
                      ) : (
                        <span className="text-text-soft">-</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">{row.is_current ? 'Y' : 'N'}</td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">
                      {new Date(row.checked_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      <Button type="button" onClick={() => toggleCurrent(row)} variant="secondary" className="py-2">
                        {row.is_current ? '현재 해제' : '현재로 지정'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-text-soft">{label}</span>
      {children}
    </label>
  )
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}
