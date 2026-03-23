'use client'

import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { logAdminChange } from '@/lib/admin/change-log'

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

  if (loading) return <p>검수 정보 불러오는 중...</p>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label>검수 상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, maxWidth: 240 }}>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label>최근 확인일</label>
        <input
          type="datetime-local"
          value={verifiedAt}
          onChange={(e) => setVerifiedAt(e.target.value)}
          style={{ padding: 10, maxWidth: 280 }}
        />
      </div>

      <button type="button" onClick={save} disabled={saving} style={{ padding: 10, width: 180 }}>
        {saving ? '저장 중...' : '검수 정보 저장'}
      </button>

      {message ? <p style={{ margin: 0, color: message.includes('저장') ? 'green' : 'crimson' }}>{message}</p> : null}
    </div>
  )
}
