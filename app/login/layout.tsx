import type { Metadata } from 'next'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Sign In — Maison Kriss Members',
  description: 'Sign in to access the private Maison Kriss members-only catalog and orders.',
  alternates: { canonical: canonicalUrl('/login') },
  robots: NOINDEX_ROBOTS,
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
