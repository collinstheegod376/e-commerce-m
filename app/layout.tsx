import type { Metadata } from 'next'
import { Syne, Space_Grotesk, Permanent_Marker } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-brush',
  display: 'swap',
})

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
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${permanentMarker.variable} dark`}
    >
      <body className="min-h-screen bg-[#01121a] font-sans text-[#f8fafc] antialiased selection:bg-[#ff660c] selection:text-[#01121a]">
        {children}
      </body>
    </html>
  )
}
