'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  initialDate?: string
  initialRegion?: string
}

export function SearchForm({ initialDate = '', initialRegion = '' }: Props) {
  const router = useRouter()
  const [playDate, setPlayDate] = useState(initialDate)
  const [region, setRegion] = useState(initialRegion)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (playDate) params.set('date', playDate)
    if (region) params.set('region', region)

    const query = params.toString()
    router.push(query ? `/search?${query}` : '/search')
  }

  function handleReset() {
    setPlayDate('')
    setRegion('')
    router.push('/search')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor="date">플레이 날짜</label>
        <input id="date" type="date" value={playDate} onChange={(e) => setPlayDate(e.target.value)} style={{ padding: 10 }} />
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor="region">지역(시/도)</label>
        <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 경기, 강원, 제주" style={{ padding: 10 }} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" style={{ padding: 12, width: 180 }}>검색</button>
        <button type="button" onClick={handleReset} style={{ padding: 12, width: 120 }}>초기화</button>
      </div>
    </form>
  )
}
