'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

    try {
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
    } catch (e: unknown) {
      setLoading(false)
      setError(e instanceof Error ? e.message : '로그인 중 오류가 발생했어.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full gap-4">
      <label className="grid gap-2">
        <div className="text-sm font-semibold text-text-soft">이메일</div>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label className="grid gap-2">
        <div className="text-sm font-semibold text-text-soft">비밀번호</div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>

      {error ? <p className="m-0 text-sm font-semibold text-danger">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '로그인 중...' : '관리자 로그인'}
      </Button>
    </form>
  )
}
