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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#01121a] font-sans text-[#f8fafc] antialiased selection:bg-[#ff660c] selection:text-[#01121a]">
        {children}
      </body>
    </html>
  )
}
