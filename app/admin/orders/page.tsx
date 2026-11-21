import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatLagosDate, formatNaira } from '@/lib/money'
import { StatusBadge } from '@/components/admin/StatusBadge'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'failed', label: 'Failed' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const sp = await searchParams
  const status = sp.status?.trim() ?? ''
  const q = sp.q?.trim() ?? ''
  const pageRaw = Number(sp.page ?? '1')
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  const where: Prisma.OrderWhereInput = {}
  if (status && STATUS_OPTIONS.some((o) => o.value === status)) {
    where.status = status
  }
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { customerEmail: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    params.set('page', String(nextPage))
    return `/admin/orders?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Fulfillment &amp; Transactions
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Orders</h1>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 border border-[#e2e2de] bg-white p-4"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by reference or email…"
          className="flex-1 min-w-[220px] border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
        />
        <select
          name="status"
          defaultValue={status}
          className="border border-[#d6d6d6] bg-white px-3 py-2 text-xs outline-none focus:border-[#030304]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
        >
          Filter
        </button>
        {status || q ? (
          <Link
            href="/admin/orders"
            className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
          >
            Reset
          </Link>
        ) : null}
      </form>

      {/* Table */}
      <div className="border border-[#e2e2de] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e2de] bg-[#fafaf8] text-[11px] uppercase text-[#6a6a6a]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Reference</th>
                <th className="px-5 py-3.5 font-medium">Date (WAT)</th>
                <th className="px-5 py-3.5 font-medium">Customer</th>
                <th className="px-5 py-3.5 font-medium">Items</th>
                <th className="px-5 py-3.5 font-medium text-right">Total</th>
                <th className="px-5 py-3.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafaf8]">
                    <td className="px-5 py-3.5 font-mono font-semibold">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-4 hover:text-[#ff5331]"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[#4a4a4a]">
                      {formatLagosDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#030304]">
                        {order.user?.name || order.customerEmail}
                      </div>
                      <div className="text-[11px] text-[#757575]">{order.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#4a4a4a]">{order._count.items}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#030304]">
                      {formatNaira(order.totalKobo)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#757575]">
                    No orders match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#e2e2de] px-5 py-3 text-xs text-[#6a6a6a]">
          <span>
            Showing page {page} of {totalPages} ({total} total orders)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildPageHref(page - 1)}
                className="border border-[#d6d6d6] px-3 py-1 hover:border-[#030304] text-[#030304]"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={buildPageHref(page + 1)}
                className="border border-[#d6d6d6] px-3 py-1 hover:border-[#030304] text-[#030304]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
