import type { Metadata } from 'next'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Reset Password — Maison Kriss',
  description: 'Set a new password for your Maison Kriss member account.',
  alternates: { canonical: canonicalUrl('/reset-password') },
  robots: NOINDEX_ROBOTS,
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
