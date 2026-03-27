'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { colors, ui } from '@/lib/design'

type Props = {
  initialDate?: string
  initialRegion?: string
}

const REGION_OPTIONS = [
  '',
  '경기',
  '강원',
  '충북',
  '충남',
  '경북',
  '경남',
  '전북',
  '전남',
  '제주',
  '서울',
  '부산',
  '인천',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
] as const

export function SearchForm({ initialDate = '', initialRegion = '' }: Props) {
  const router = useRouter()
  const dateRef = useRef<HTMLInputElement | null>(null)
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

  function openCalendar() {
    const input = dateRef.current
    if (!input) return
    input.focus()
    if (typeof input.showPicker === 'function') input.showPicker()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="date" style={{ color: colors.textSoft, fontWeight: 700 }}>플레이 날짜</label>
          <div style={{ display: 'grid', gap: 8 }}>
            <input ref={dateRef} id="date" type="date" value={playDate} onChange={(e) => setPlayDate(e.target.value)} onClick={openCalendar} style={ui.input} />
            <button type="button" onClick={openCalendar} style={{ ...ui.buttonSecondary, width: '100%' }}>달력으로 선택</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="region" style={{ color: colors.textSoft, fontWeight: 700 }}>지역(시/도)</label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} style={ui.input}>
            <option value="">전체</option>
            {REGION_OPTIONS.filter(Boolean).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" style={{ ...ui.buttonPrimary, minWidth: 180 }}>검색</button>
        <button type="button" onClick={handleReset} style={{ ...ui.buttonSecondary, minWidth: 120 }}>초기화</button>
      </div>
    </form>
  )
}
