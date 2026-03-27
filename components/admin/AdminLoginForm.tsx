'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { colors, ui } from '@/lib/design'

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getBrowserSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, maxWidth: 360 }}>
      <label style={{ display: 'grid', gap: 8 }}>
        <div style={{ color: colors.textSoft, fontWeight: 700 }}>이메일</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={ui.input}
        />
      </label>

      <label style={{ display: 'grid', gap: 8 }}>
        <div style={{ color: colors.textSoft, fontWeight: 700 }}>비밀번호</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={ui.input}
        />
      </label>

      {error ? <p style={{ color: colors.danger, margin: 0 }}>{error}</p> : null}

      <button type="submit" disabled={loading} style={ui.buttonPrimary}>
        {loading ? '로그인 중...' : '관리자 로그인'}
      </button>
    </form>
  )
}
