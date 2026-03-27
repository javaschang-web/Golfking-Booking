'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { colors, ui } from '@/lib/design'

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="date" style={{ color: colors.textSoft, fontWeight: 700 }}>플레이 날짜</label>
          <input id="date" type="date" value={playDate} onChange={(e) => setPlayDate(e.target.value)} style={ui.input} />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="region" style={{ color: colors.textSoft, fontWeight: 700 }}>지역(시/도)</label>
          <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 경기, 강원, 제주" style={ui.input} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" style={{ ...ui.buttonPrimary, minWidth: 180 }}>검색</button>
        <button type="button" onClick={handleReset} style={{ ...ui.buttonSecondary, minWidth: 120 }}>초기화</button>
      </div>
    </form>
  )
}
