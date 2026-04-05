'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const statuses = ['draft', 'verified', 'needs_review', 'hidden'] as const

export function AdminCourseVerificationPanel({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState('draft')
  const [verifiedAt, setVerifiedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getBrowserSupabaseClient()
      const { data, error } = await supabase
        .from('golf_courses')
        .select('verification_status, last_verified_at')
        .eq('id', courseId)
        .maybeSingle()

      if (!error && data) {
        setStatus(data.verification_status ?? 'draft')
        setVerifiedAt(data.last_verified_at ? data.last_verified_at.slice(0, 16) : '')
      }
      setLoading(false)
    }

    load()
  }, [courseId])

  async function save() {
    setSaving(true)
    setMessage(null)

    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase
      .from('golf_courses')
      .update({
        verification_status: status,
        last_verified_at: verifiedAt ? new Date(verifiedAt).toISOString() : null,
      })
      .eq('id', courseId)

    setSaving(false)

    if (!error) {
      await logAdminChange({
        entityType: 'golf_course',
        entityId: courseId,
        actionType: 'verify_update',
        changedFields: {
          verification_status: status,
          last_verified_at: verifiedAt ? new Date(verifiedAt).toISOString() : null,
        },
        note: '검수 상태/최근 확인일 수정',
      })
    }

    setMessage(error ? error.message : '검수 상태를 저장했어.')
  }

  if (loading) return <p className="text-sm text-text-soft">검수 정보 불러오는 중...</p>

  return (
    <div className="grid max-w-md gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-text-soft">검수 상태</label>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-text-soft">최근 확인일</label>
        <Input type="datetime-local" value={verifiedAt} onChange={(e) => setVerifiedAt(e.target.value)} className="max-w-sm" />
        <p className="m-0 text-xs text-text-soft">비워두면 최근 확인일은 null로 저장돼.</p>
      </div>

      <Button type="button" onClick={save} disabled={saving} className="w-full sm:w-56">
        {saving ? '저장 중...' : '검수 정보 저장'}
      </Button>

      {message ? (
        <p className={`m-0 text-sm font-semibold ${message.includes('저장') ? 'text-primary-strong' : 'text-danger'}`}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
