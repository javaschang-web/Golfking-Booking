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

  const fieldStyle = {
    display: 'grid',
    gap: 8,
    alignContent: 'start',
  } as const

  const helperStyle = {
    margin: 0,
    minHeight: 20,
    fontSize: 13,
    color: colors.textSoft,
  } as const

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18, maxWidth: 860 }}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(220px, 1fr) auto',
          alignItems: 'end',
        }}
      >
        <div style={fieldStyle}>
          <label htmlFor="date" style={{ color: colors.textSoft, fontWeight: 700 }}>플레이 날짜</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
            <input
              ref={dateRef}
              id="date"
              type="date"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
              onClick={openCalendar}
              style={{ ...ui.input, minHeight: 52 }}
            />
            <button type="button" onClick={openCalendar} style={{ ...ui.buttonSecondary, minHeight: 52, whiteSpace: 'nowrap' }}>
              달력 보기
            </button>
          </div>
          <p style={helperStyle}>브라우저 달력에서 바로 날짜를 고를 수 있어.</p>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="region" style={{ color: colors.textSoft, fontWeight: 700 }}>지역(시/도)</label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...ui.input, minHeight: 52 }}>
            <option value="">전체</option>
            {REGION_OPTIONS.filter(Boolean).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <p style={helperStyle}>지역을 선택하면 해당 권역 골프장만 추려서 보여줘.</p>
        </div>

        <div style={{ display: 'grid', gap: 10, alignSelf: 'stretch' }}>
          <button type="submit" style={{ ...ui.buttonPrimary, minWidth: 140, minHeight: 52 }}>검색</button>
          <button type="button" onClick={handleReset} style={{ ...ui.buttonSecondary, minWidth: 140, minHeight: 52 }}>초기화</button>
        </div>
      </div>
    </form>
  )
}
