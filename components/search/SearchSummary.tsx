type Props = {
  total: number
  region?: string
  playDate?: string
}

export function SearchSummary({ total, region, playDate }: Props) {
  return (
    <div style={{ padding: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8, display: 'grid', gap: 8 }}>
      <strong>검색 요약</strong>
      <p style={{ margin: 0 }}>결과 수: {total}개</p>
      <p style={{ margin: 0 }}>지역: {region || '전체'}</p>
      <p style={{ margin: 0 }}>플레이 날짜: {playDate || '미입력'}</p>
      <p style={{ margin: 0, fontSize: 14, color: '#666' }}>지역을 비우면 전체 골프장을 보고, 날짜를 넣으면 예약 오픈 계산이 함께 보여.</p>
    </div>
  )
}
