import { SearchForm } from '@/components/search/SearchForm'
import { colors, ui } from '@/lib/design'

export default function Home() {
  return (
    <main style={ui.page}>
      <div style={ui.shell}>
        <section style={ui.hero}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={ui.badge}>실시간 예약 오픈 탐색</div>
            <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.1 }}>골프왕부킹</h1>
            <p style={{ margin: 0, color: colors.textSoft, fontSize: 17, maxWidth: 720 }}>
              희망 라운딩 날짜와 지역을 입력하면 예약 오픈 정책이 정리된 골프장을 빠르게 찾을 수 있어.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <SearchForm />
          </div>
        </section>
      </div>
    </main>
  )
}
