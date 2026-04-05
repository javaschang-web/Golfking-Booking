'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type CourseForm = {
  slug: string
  name: string
  english_name: string
  region_primary: string
  region_secondary: string
  address: string
  phone: string
  homepage_url: string
  booking_url: string
  map_url: string
  membership_required: boolean
  membership_note: string
  booking_note: string
  status: string
  verification_status: string
}

const initialForm: CourseForm = {
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

export function AdminCourseEditForm({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [form, setForm] = useState<CourseForm>(initialForm)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(form.slug.trim() && form.name.trim() && form.region_primary.trim())
  }, [form])

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase
        .from('golf_courses')
        .select(
          'slug, name, english_name, region_primary, region_secondary, address, phone, homepage_url, booking_url, map_url, membership_required, membership_note, booking_note, status, verification_status'
        )
        .eq('id', courseId)
        .maybeSingle()

      if (error || !data) {
        setError(error?.message ?? '골프장 정보를 찾지 못했어.')
        setInitialLoading(false)
        return
      }

      setForm({
        slug: data.slug ?? '',
        name: data.name ?? '',
        english_name: data.english_name ?? '',
        region_primary: data.region_primary ?? '',
        region_secondary: data.region_secondary ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        homepage_url: data.homepage_url ?? '',
        booking_url: data.booking_url ?? '',
        map_url: data.map_url ?? '',
        membership_required: Boolean(data.membership_required),
        membership_note: data.membership_note ?? '',
        booking_note: data.booking_note ?? '',
        status: data.status ?? 'active',
        verification_status: data.verification_status ?? 'draft',
      })
      setInitialLoading(false)
    }

    load()
  }, [courseId])

  function update<K extends keyof CourseForm>(key: K, value: CourseForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSaving(true)
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
    const { error } = await supabase.from('golf_courses').update(payload).eq('id', courseId)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('골프장 정보를 저장했어.')
    router.refresh()
  }

  if (initialLoading) return <p className="text-sm text-text-soft">골프장 정보 불러오는 중...</p>
  if (error) return <p className="text-sm font-semibold text-danger">{error}</p>

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-3xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="슬러그 *">
          <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} required />
        </Field>
        <Field label="골프장명 *">
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="영문명">
          <Input value={form.english_name} onChange={(e) => update('english_name', e.target.value)} />
        </Field>
        <Field label="대표 지역 *">
          <Input value={form.region_primary} onChange={(e) => update('region_primary', e.target.value)} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="세부 지역">
          <Input value={form.region_secondary} onChange={(e) => update('region_secondary', e.target.value)} />
        </Field>
        <Field label="전화번호">
          <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </Field>
      </div>

      <Field label="주소">
        <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="홈페이지 URL">
          <Input value={form.homepage_url} onChange={(e) => update('homepage_url', e.target.value)} />
        </Field>
        <Field label="예약 URL">
          <Input value={form.booking_url} onChange={(e) => update('booking_url', e.target.value)} />
        </Field>
      </div>

      <Field label="지도 URL">
        <Input value={form.map_url} onChange={(e) => update('map_url', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="상태">
          <Select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="seasonal_closed">seasonal_closed</option>
            <option value="maintenance">maintenance</option>
          </Select>
        </Field>
        <Field label="검수 상태">
          <Select value={form.verification_status} onChange={(e) => update('verification_status', e.target.value)}>
            <option value="draft">draft</option>
            <option value="verified">verified</option>
            <option value="needs_review">needs_review</option>
            <option value="hidden">hidden</option>
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-soft">
        <input
          type="checkbox"
          checked={form.membership_required}
          onChange={(e) => update('membership_required', e.target.checked)}
        />
        회원권/회원 자격 필요
      </label>

      <Field label="회원 메모">
        <Textarea value={form.membership_note} onChange={(e) => update('membership_note', e.target.value)} rows={3} />
      </Field>

      <Field label="부킹 메모">
        <Textarea value={form.booking_note} onChange={(e) => update('booking_note', e.target.value)} rows={4} />
      </Field>

      {success ? <p className="m-0 text-sm font-semibold text-primary-strong">{success}</p> : null}
      {error ? <p className="m-0 text-sm font-semibold text-danger">{error}</p> : null}

      <Button type="submit" disabled={!canSubmit || saving} className="w-full sm:w-56">
        {saving ? '저장 중...' : '골프장 저장'}
      </Button>
    </form>
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
