'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'
import { colors, ui } from '@/lib/design'

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
    const { error } = await supabase
      .from('source_records')
      .update({ is_current: !row.is_current })
      .eq('id', row.id)

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
    <section style={{ display: 'grid', gap: 24 }}>
      <div>
        <h2>출처 / 검수 기록</h2>
        <p style={{ marginTop: 8, color: colors.textSoft }}>정책의 출처 링크와 원문을 관리할 수 있어.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 960, ...ui.card }}>
        <div style={grid2}>
          <Field label="출처 타입 *">
            <select value={form.source_type} onChange={(e) => update('source_type', e.target.value)} style={inputStyle}>
              <option value="manual">manual</option>
              <option value="homepage">homepage</option>
              <option value="reservation_page">reservation_page</option>
              <option value="notice_page">notice_page</option>
              <option value="phone_confirmed">phone_confirmed</option>
              <option value="user_report">user_report</option>
              <option value="crawler">crawler</option>
            </select>
          </Field>

          <Field label="연결 정책">
            <select value={form.booking_policy_id} onChange={(e) => update('booking_policy_id', e.target.value)} style={inputStyle}>
              <option value="">정책 미연결</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.policy_type} {policy.policy_summary ? `- ${policy.policy_summary}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={grid2}>
          <Field label="출처 URL">
            <input value={form.source_url} onChange={(e) => update('source_url', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="출처 제목">
            <input value={form.source_title} onChange={(e) => update('source_title', e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <Field label="캡처 원문">
          <textarea value={form.captured_text} onChange={(e) => update('captured_text', e.target.value)} rows={5} style={textareaStyle} />
        </Field>

        <Field label="메모">
          <textarea value={form.note} onChange={(e) => update('note', e.target.value)} rows={3} style={textareaStyle} />
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSoft }}>
          <input type="checkbox" checked={form.is_current} onChange={(e) => update('is_current', e.target.checked)} />
          현재 유효한 출처로 표시
        </label>

        {error ? <p style={{ color: colors.danger, margin: 0 }}>{error}</p> : null}
        {success ? <p style={{ color: colors.primaryStrong, margin: 0 }}>{success}</p> : null}

        <button type="submit" disabled={!canSubmit || saving} style={{ ...ui.buttonPrimary, width: 220 }}>
          {saving ? '저장 중...' : '출처 기록 추가'}
        </button>
      </form>

      <div style={ui.card}>
        <h3 style={{ marginTop: 0 }}>등록된 출처 기록</h3>
        {loading ? <p>출처 기록 불러오는 중...</p> : null}
        {!loading && rows.length === 0 ? <p>등록된 출처 기록이 아직 없어.</p> : null}
        {!loading && rows.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>타입</th>
                  <th style={th}>제목</th>
                  <th style={th}>URL</th>
                  <th style={th}>현재</th>
                  <th style={th}>확인일</th>
                  <th style={th}>작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={td}>{row.source_type}</td>
                    <td style={td}>{row.source_title ?? '-'}</td>
                    <td style={td}>{row.source_url ? <a href={row.source_url} target="_blank" rel="noreferrer" style={ui.link}>열기</a> : '-'}</td>
                    <td style={td}>{row.is_current ? 'Y' : 'N'}</td>
                    <td style={td}>{new Date(row.checked_at).toLocaleString('ko-KR')}</td>
                    <td style={td}>
                      <button type="button" onClick={() => toggleCurrent(row)} style={{ ...ui.buttonSecondary, padding: '8px 12px' }}>
                        {row.is_current ? '현재 해제' : '현재로 지정'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ color: colors.textSoft, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  )
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
}

const inputStyle: React.CSSProperties = {
  ...ui.input,
}

const textareaStyle: React.CSSProperties = {
  ...ui.input,
  resize: 'vertical',
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: `1px solid ${colors.border}`,
  padding: '10px 8px',
  color: colors.textSoft,
}

const td: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
  padding: '10px 8px',
  verticalAlign: 'top',
}
