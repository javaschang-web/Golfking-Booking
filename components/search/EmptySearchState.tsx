import Link from 'next/link'

export function EmptySearchState() {
  return (
    <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
      <strong>검색 결과가 없어.</strong>
      <p style={{ margin: '10px 0 0 0' }}>지역 조건을 비우거나 다른 날짜로 다시 검색해봐.</p>
      <p style={{ margin: '10px 0 0 0' }}>
        <Link href="/">검색 홈으로 돌아가기</Link>
      </p>
    </div>
  )
}
