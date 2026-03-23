export function AdminServerNotice() {
  return (
    <div style={{ padding: 12, border: '1px solid #e5e5e5', borderRadius: 8, background: '#fafafa' }}>
      <strong>보호 상태</strong>
      <p style={{ margin: '8px 0 0 0' }}>이 페이지는 middleware + 서버 가드 + 클라이언트 확인 레이어를 함께 사용 중이야.</p>
    </div>
  )
}
