import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatShippingAddress } from '@/lib/money'
import { extractOrderTrackingMeta } from '@/lib/order-status'
import {
  AdminOrdersTableClient,
  type AdminOrderRowData,
} from '@/components/admin/AdminOrdersTableClient'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'waiting_confirmation', label: 'Waiting for Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'sent_out', label: 'Sent Out' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
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
    if (status === 'delivered') {
      where.status = { in: ['delivered', 'fulfilled'] }
    } else {
      where.status = status
    }
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
        items: true,
        events: { orderBy: { receivedAt: 'asc' } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const serializedOrders: AdminOrderRowData[] = orders.map((order) => ({
    id: order.id,
    reference: order.reference,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    subtotalKobo: order.subtotalKobo,
    shippingKobo: order.shippingKobo,
    totalKobo: order.totalKobo,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerName: order.user?.name ?? null,
    shippingAddressFormatted: formatShippingAddress(order.shippingAddress),
    itemCount: order._count.items,
    items: order.items.map((item) => ({
      id: item.id,
      productNameSnap: item.productNameSnap,
      sizeSnap: item.sizeSnap,
      unitPriceKobo: item.unitPriceKobo,
      qty: item.qty,
    })),
    trackingMeta: extractOrderTrackingMeta(order, order.events),
  }))

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
        <p className="mt-1 text-xs text-[#6a6a6a]">
          Click any order row to inspect items, view the delivery timeline, and update status.
        </p>
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

      {/* Expandable Orders Table */}
      <div className="border border-[#e2e2de] bg-white">
        <AdminOrdersTableClient orders={serializedOrders} />

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#e2e2de] px-5 py-3 text-xs text-[#6a6a6a]">
          <span>
            Showing page {page} of {totalPages} ({total} total orders)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildPageHref(page - 1)}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304] hover:border-[#030304]"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={buildPageHref(page + 1)}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304] hover:border-[#030304]"
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
