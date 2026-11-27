import type { Metadata } from 'next'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Email Confirmed — Maison Kriss',
  description: 'Your Maison Kriss member email has been verified.',
  alternates: { canonical: canonicalUrl('/auth/confirmed') },
  robots: NOINDEX_ROBOTS,
}

export default function AuthConfirmedLayout({ children }: { children: React.ReactNode }) {
  return children
}
