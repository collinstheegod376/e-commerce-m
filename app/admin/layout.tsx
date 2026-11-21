import { requireAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

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
