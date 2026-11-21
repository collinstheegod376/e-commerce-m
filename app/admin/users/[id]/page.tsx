import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatLagosDate, formatNaira, formatShippingAddress } from '@/lib/money'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { UserRoleToggle } from '@/components/admin/UserRoleToggle'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  const { id } = await params

  const user = await prisma.profile.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { _count: { select: { items: true } } },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const totalSpentKobo = user.orders
    .filter((o) => o.status === 'paid' || o.status === 'fulfilled')
    .reduce((sum, o) => sum + o.totalKobo, 0)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
        >
          ← Back to Users
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
          {user.name || user.email}
        </h1>
        <p className="mt-1 text-xs text-[#6a6a6a]">
          Member since {formatLagosDate(user.createdAt)} · Total paid spend{' '}
          <strong className="text-[#030304]">{formatNaira(totalSpentKobo)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="border border-[#e2e2de] bg-white p-6 lg:col-span-4 space-y-4 self-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">Email</p>
            <p className="mt-1 text-sm font-medium text-[#030304]">{user.email}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">Phone</p>
            <p className="mt-1 text-sm text-[#030304]">{user.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Saved Address
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#4a4a4a]">
              {formatShippingAddress(user.address)}
            </p>
          </div>

          <UserRoleToggle
            userId={user.id}
            userEmail={user.email}
            currentRole={user.role}
            isSelf={user.id === admin.id}
          />
        </aside>

        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
            Order History ({user.orders.length})
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e2e2de] text-[11px] uppercase text-[#6a6a6a]">
                <tr>
                  <th className="pb-2.5 font-medium">Reference</th>
                  <th className="pb-2.5 font-medium">Date (WAT)</th>
                  <th className="pb-2.5 font-medium">Items</th>
                  <th className="pb-2.5 font-medium text-right">Total</th>
                  <th className="pb-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {user.orders.length > 0 ? (
                  user.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fafaf8]">
                      <td className="py-3 font-mono font-semibold">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="underline underline-offset-4 hover:text-[#ff5331]"
                        >
                          {order.reference}
                        </Link>
                      </td>
                      <td className="py-3 text-[#4a4a4a]">{formatLagosDate(order.createdAt)}</td>
                      <td className="py-3 text-[#4a4a4a]">{order._count.items}</td>
                      <td className="py-3 text-right font-semibold text-[#030304]">
                        {formatNaira(order.totalKobo)}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#757575]">
                      This member has not placed any orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
