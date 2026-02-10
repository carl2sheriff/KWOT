import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KWOT CRM',
  description: 'CRM Sheriff Projects - Navigator Style',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
