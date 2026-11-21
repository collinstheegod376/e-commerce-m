import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Maison Kriss — Lagos Contemporary Clothing',
  description:
    'Members-only Nigerian contemporary design & streetwear studio. Heavyweight garments, interactive 3D inspection, and numbered releases.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-[#030304]">{children}</body>
    </html>
  )
}
