import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { colors } from '@/lib/design'

export const metadata: Metadata = {
  title: '골프왕부킹',
  description: '골프 예약 오픈 정보 탐색 서비스',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: colors.bg, color: colors.text }}>
        {children}
      </body>
    </html>
  )
}
