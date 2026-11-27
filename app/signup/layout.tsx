import type { Metadata } from 'next'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Create Member Account — Maison Kriss',
  description: 'Create your Maison Kriss membership account to access the Lagos studio archive.',
  alternates: { canonical: canonicalUrl('/signup') },
  robots: NOINDEX_ROBOTS,
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
