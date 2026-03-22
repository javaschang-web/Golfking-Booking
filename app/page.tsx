import { SearchForm } from '@/components/search/SearchForm'

export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <h1>골프왕부킹</h1>
      <p>희망 라운딩 날짜와 지역을 입력하면 예약 오픈 정책이 등록된 골프장을 찾아볼 수 있어.</p>

      <div style={{ marginTop: 24 }}>
        <SearchForm />
      </div>
    </main>
  )
}
