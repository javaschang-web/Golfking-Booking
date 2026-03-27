'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { colors, ui } from '@/lib/design'

const initialForm = {
  slug: '',
  name: '',
  english_name: '',
  region_primary: '',
  region_secondary: '',
  address: '',
  phone: '',
  homepage_url: '',
  booking_url: '',
  map_url: '',
  membership_required: false,
  membership_note: '',
  booking_note: '',
  status: 'active',
  verification_status: 'draft',
}

export function AdminCourseCreateForm() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(form.slug.trim() && form.name.trim() && form.region_primary.trim())
  }, [form])

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      english_name: emptyToNull(form.english_name),
      region_primary: form.region_primary.trim(),
      region_secondary: emptyToNull(form.region_secondary),
      address: emptyToNull(form.address),
      phone: emptyToNull(form.phone),
      homepage_url: emptyToNull(form.homepage_url),
      booking_url: emptyToNull(form.booking_url),
      map_url: emptyToNull(form.map_url),
      membership_required: form.membership_required,
      membership_note: emptyToNull(form.membership_note),
      booking_note: emptyToNull(form.booking_note),
      status: form.status,
      verification_status: form.verification_status,
    }

    const supabase = getBrowserSupabaseClient()
    const { data, error } = await supabase.from('golf_courses').insert(payload).select('id').single()

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('골프장을 등록했어.')
    setForm(initialForm)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 900 }}>
      <div style={grid2}>
        <Field label="슬러그 *">
          <input value={form.slug} onChange={(e) => update('slug', e.target.value)} required style={inputStyle} />
        </Field>
        <Field label="골프장명 *">
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required style={inputStyle} />
        </Field>
      </div>

      <div style={grid2}>
        <Field label="영문명">
          <input value={form.english_name} onChange={(e) => update('english_name', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="대표 지역 *">
          <input value={form.region_primary} onChange={(e) => update('region_primary', e.target.value)} required style={inputStyle} />
        </Field>
      </div>

      <div style={grid2}>
        <Field label="세부 지역">
          <input value={form.region_secondary} onChange={(e) => update('region_secondary', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="전화번호">
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <Field label="주소">
        <input value={form.address} onChange={(e) => update('address', e.target.value)} style={inputStyle} />
      </Field>

      <div style={grid2}>
        <Field label="홈페이지 URL">
          <input value={form.homepage_url} onChange={(e) => update('homepage_url', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="예약 URL">
          <input value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <Field label="지도 URL">
        <input value={form.map_url} onChange={(e) => update('map_url', e.target.value)} style={inputStyle} />
      </Field>

      <div style={grid2}>
        <Field label="상태">
          <select value={form.status} onChange={(e) => update('status', e.target.value)} style={inputStyle}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="seasonal_closed">seasonal_closed</option>
            <option value="maintenance">maintenance</option>
          </select>
        </Field>
        <Field label="검수 상태">
          <select value={form.verification_status} onChange={(e) => update('verification_status', e.target.value)} style={inputStyle}>
            <option value="draft">draft</option>
            <option value="verified">verified</option>
            <option value="needs_review">needs_review</option>
            <option value="hidden">hidden</option>
          </select>
        </Field>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSoft }}>
        <input
          type="checkbox"
          checked={form.membership_required}
          onChange={(e) => update('membership_required', e.target.checked)}
        />
        회원권/회원 자격 필요
      </label>

      <Field label="회원 메모">
        <textarea value={form.membership_note} onChange={(e) => update('membership_note', e.target.value)} rows={3} style={textareaStyle} />
      </Field>

      <Field label="부킹 메모">
        <textarea value={form.booking_note} onChange={(e) => update('booking_note', e.target.value)} rows={4} style={textareaStyle} />
      </Field>

      {error ? <p style={{ color: colors.danger, margin: 0 }}>등록 실패: {error}</p> : null}
      {success ? <p style={{ color: colors.primaryStrong, margin: 0 }}>{success}</p> : null}

      <button type="submit" disabled={!canSubmit || loading} style={{ ...ui.buttonPrimary, width: 220 }}>
        {loading ? '등록 중...' : '골프장 등록'}
      </button>
    </form>
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
