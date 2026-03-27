import Link from 'next/link'
import { colors, ui } from '@/lib/design'

export function EmptySearchState() {
  return (
    <div style={ui.card}>
      <strong>검색 결과가 없어.</strong>
      <p style={{ margin: '10px 0 0 0', color: colors.textSoft }}>지역 조건을 비우거나 다른 날짜로 다시 검색해봐.</p>
      <p style={{ margin: '10px 0 0 0' }}>
        <Link href="/" style={ui.link}>검색 홈으로 돌아가기</Link>
      </p>
    </div>
  )
}
