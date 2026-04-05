'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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
    <form onSubmit={handleSubmit} className="grid w-full gap-4">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_160px] md:items-end">
        <div className="grid gap-2">
          <label htmlFor="date" className="text-sm font-semibold text-text-soft">
            플레이 날짜
          </label>

          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <Input
              ref={dateRef}
              id="date"
              type="date"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
              onClick={openCalendar}
            />
            <Button type="button" variant="secondary" onClick={openCalendar} className="whitespace-nowrap">
              달력 보기
            </Button>
          </div>

          <p className="m-0 min-h-5 text-xs text-text-soft">브라우저 달력에서 날짜를 고르면 편해.</p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="region" className="text-sm font-semibold text-text-soft">
            지역(시/도)
          </label>
          <Select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">전체</option>
            {REGION_OPTIONS.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <p className="m-0 min-h-5 text-xs text-text-soft">지역을 고르면 해당 권역 골프장만 보여줘.</p>
        </div>

        <div className="grid gap-2">
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            초기화
          </Button>
        </div>
      </div>
    </form>
  )
}
