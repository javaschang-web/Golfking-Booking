type Props = {
  total: number
  region?: string
  playDate?: string
}

export function SearchSummary({ total, region, playDate }: Props) {
  return (
    <div style={{ padding: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8 }}>
      <strong>검색 요약</strong>
      <p style={{ margin: '8px 0 0 0' }}>결과 수: {total}개</p>
      <p style={{ margin: '8px 0 0 0' }}>지역: {region || '전체'}</p>
      <p style={{ margin: '8px 0 0 0' }}>플레이 날짜: {playDate || '미입력'}</p>
    </div>
  )
}
