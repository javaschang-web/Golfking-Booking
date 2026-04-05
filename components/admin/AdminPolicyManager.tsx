'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type PolicyRow = {
  id: string
  policy_type: string
  policy_summary: string | null
  source_text: string | null
  days_before_open: number | null
  open_weekday: number | null
  open_time: string | null
  monthly_open_day: number | null
  monthly_offset_months: number | null
  rule_interpretation: string | null
  manual_open_datetime: string | null
  is_active: boolean
  last_verified_at: string | null
  note: string | null
}

type PolicyForm = {
  id: string | null
  policy_type: string
  policy_summary: string
  source_text: string
  days_before_open: string
  open_weekday: string
  open_time: string
  monthly_open_day: string
  monthly_offset_months: string
  rule_interpretation: string
  manual_open_datetime: string
  is_active: boolean
  note: string
}

const initialForm: PolicyForm = {
  id: null,
  policy_type: 'days_before',
  policy_summary: '',
  source_text: '',
  days_before_open: '',
  open_weekday: '',
  open_time: '',
  monthly_open_day: '',
  monthly_offset_months: '',
  rule_interpretation: '',
  manual_open_datetime: '',
  is_active: true,
  note: '',
}

export function AdminPolicyManager({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<PolicyRow[]>([])
  const [form, setForm] = useState<PolicyForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isEdit = Boolean(form.id)

  const canSubmit = useMemo(() => {
    return Boolean(form.policy_type.trim())
  }, [form])

  async function load() {
    const supabase = getBrowserSupabaseClient()
    const { data, error } = await supabase
      .from('booking_policies')
      .select(
        'id, policy_type, policy_summary, source_text, days_before_open, open_weekday, open_time, monthly_open_day, monthly_offset_months, rule_interpretation, manual_open_datetime, is_active, last_verified_at, note'
      )
      .eq('golf_course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setRows((data ?? []) as PolicyRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [courseId])

  function update<K extends keyof PolicyForm>(key: K, value: PolicyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startEdit(row: PolicyRow) {
    setForm({
      id: row.id,
      policy_type: row.policy_type,
      policy_summary: row.policy_summary ?? '',
      source_text: row.source_text ?? '',
      days_before_open: row.days_before_open?.toString() ?? '',
      open_weekday: row.open_weekday?.toString() ?? '',
      open_time: row.open_time ?? '',
      monthly_open_day: row.monthly_open_day?.toString() ?? '',
      monthly_offset_months: row.monthly_offset_months?.toString() ?? '',
      rule_interpretation: row.rule_interpretation ?? '',
      manual_open_datetime: row.manual_open_datetime ?? '',
      is_active: row.is_active,
      note: row.note ?? '',
    })
    setSuccess(null)
    setError(null)
  }

  function resetForm() {
    setForm(initialForm)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      golf_course_id: courseId,
      policy_type: form.policy_type,
      policy_summary: emptyToNull(form.policy_summary),
      source_text: emptyToNull(form.source_text),
      days_before_open: numberOrNull(form.days_before_open),
      open_weekday: numberOrNull(form.open_weekday),
      open_time: emptyToNull(form.open_time),
      monthly_open_day: numberOrNull(form.monthly_open_day),
      monthly_offset_months: numberOrNull(form.monthly_offset_months),
      rule_interpretation: emptyToNull(form.rule_interpretation),
      manual_open_datetime: emptyToNull(form.manual_open_datetime),
      is_active: form.is_active,
      note: emptyToNull(form.note),
    }

    const supabase = getBrowserSupabaseClient()
    const query = form.id
      ? supabase.from('booking_policies').update(payload).eq('id', form.id)
      : supabase.from('booking_policies').insert(payload)

    const { error } = await query

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'booking_policy',
      entityId: form.id ?? courseId,
      actionType: form.id ? 'update' : 'create',
      changedFields: payload,
      note: form.id ? '예약 정책 수정' : '예약 정책 추가',
    })

    setSuccess(form.id ? '정책을 수정했어.' : '정책을 추가했어.')
    resetForm()
    await load()
  }

  async function toggleActive(row: PolicyRow) {
    setError(null)
    setSuccess(null)
    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase.from('booking_policies').update({ is_active: !row.is_active }).eq('id', row.id)

    if (error) {
      setError(error.message)
      return
    }

    await logAdminChange({
      entityType: 'booking_policy',
      entityId: row.id,
      actionType: 'toggle_active',
      changedFields: { is_active: !row.is_active },
      note: row.is_active ? '정책 비활성화' : '정책 활성화',
    })

    setSuccess('정책 활성 상태를 바꿨어.')
    await load()
  }

  return (
    <section className="grid gap-5">
      <div>
        <h3 className="text-base font-semibold">예약 정책 관리</h3>
        <p className="mt-1 text-sm text-text-soft">골프장별 예약 오픈 규칙을 추가/수정할 수 있어.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="정책 타입 *">
              <Select value={form.policy_type} onChange={(e) => update('policy_type', e.target.value)}>
                <option value="days_before">days_before</option>
                <option value="weekday_rule">weekday_rule</option>
                <option value="monthly_batch">monthly_batch</option>
                <option value="manual">manual</option>
                <option value="custom_formula">custom_formula</option>
              </Select>
            </Field>
            <Field label="요약">
              <Input value={form.policy_summary} onChange={(e) => update('policy_summary', e.target.value)} />
            </Field>
          </div>

          <Field label="원문 문구">
            <Textarea value={form.source_text} onChange={(e) => update('source_text', e.target.value)} rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="days_before_open">
              <Input value={form.days_before_open} onChange={(e) => update('days_before_open', e.target.value)} />
            </Field>
            <Field label="open_weekday">
              <Input value={form.open_weekday} onChange={(e) => update('open_weekday', e.target.value)} />
            </Field>
            <Field label="open_time">
              <Input value={form.open_time} onChange={(e) => update('open_time', e.target.value)} placeholder="09:00" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="monthly_open_day">
              <Input value={form.monthly_open_day} onChange={(e) => update('monthly_open_day', e.target.value)} />
            </Field>
            <Field label="monthly_offset_months">
              <Input value={form.monthly_offset_months} onChange={(e) => update('monthly_offset_months', e.target.value)} />
            </Field>
            <Field label="manual_open_datetime">
              <Input
                value={form.manual_open_datetime}
                onChange={(e) => update('manual_open_datetime', e.target.value)}
                placeholder="2026-03-22T09:00:00+09:00"
              />
            </Field>
          </div>

          <Field label="rule_interpretation">
            <Input value={form.rule_interpretation} onChange={(e) => update('rule_interpretation', e.target.value)} />
          </Field>

          <Field label="운영 메모">
            <Textarea value={form.note} onChange={(e) => update('note', e.target.value)} rows={3} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-text-soft">
            <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} />
            활성 정책
          </label>

          {error ? <p className="m-0 text-sm font-semibold text-danger">{error}</p> : null}
          {success ? <p className="m-0 text-sm font-semibold text-primary-strong">{success}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? '저장 중...' : isEdit ? '정책 저장' : '정책 추가'}
            </Button>
            {isEdit ? (
              <Button type="button" onClick={resetForm} variant="secondary">
                편집 취소
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">등록된 정책</h3>
            <p className="mt-1 text-sm text-text-soft">정책을 선택해서 수정하거나 활성 상태를 바꿀 수 있어.</p>
          </div>
        </div>

        {loading ? <p className="mt-3 text-sm text-text-soft">정책 불러오는 중...</p> : null}
        {!loading && rows.length === 0 ? <p className="mt-3 text-sm text-text-soft">등록된 정책이 아직 없어.</p> : null}

        {!loading && rows.length > 0 ? (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-panel">
            <table className="min-w-[720px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-text-soft">
                  <th className="border-b border-border px-3 py-3 font-semibold">타입</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">요약</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">활성</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">최근 확인</th>
                  <th className="border-b border-border px-3 py-3 font-semibold">작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-panel-alt/40">
                    <td className="border-b border-border px-3 py-3 font-medium text-text">{row.policy_type}</td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">{row.policy_summary ?? '-'}</td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">{row.is_active ? 'Y' : 'N'}</td>
                    <td className="border-b border-border px-3 py-3 text-text-soft">
                      {row.last_verified_at ? new Date(row.last_verified_at).toLocaleString('ko-KR') : '-'}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => startEdit(row)} variant="secondary" className="py-2">
                          수정
                        </Button>
                        <Button type="button" onClick={() => toggleActive(row)} variant="secondary" className="py-2">
                          {row.is_active ? '비활성화' : '활성화'}
                        </Button>
                      </div>
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

function numberOrNull(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}
