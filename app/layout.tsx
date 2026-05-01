import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MeetPoint',
  description: '친구 위치 공유 및 약속 장소 추천',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
