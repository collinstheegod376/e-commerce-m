import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard — Maison Kriss',
  description: 'Internal Maison Kriss studio administration.',
  alternates: { canonical: canonicalUrl('/admin') },
  robots: NOINDEX_ROBOTS,
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const admin = await requireAdmin()

  return (
    <AdminShell
      adminName={admin.name || 'Maison Kriss Admin'}
      adminEmail={admin.email}
    >
      {children}
    </AdminShell>
  )
}
