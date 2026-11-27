import type { Metadata } from 'next'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Forgot Password — Maison Kriss',
  description: 'Request a one-time password recovery link for your Maison Kriss member account.',
  alternates: { canonical: canonicalUrl('/forgot-password') },
  robots: NOINDEX_ROBOTS,
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
