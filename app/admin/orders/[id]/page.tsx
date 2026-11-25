import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatLagosDate, formatNaira, formatShippingAddress } from '@/lib/money'
import { extractOrderTrackingMeta } from '@/lib/order-status'
import { OrderStatusStepper, StatusBadge } from '@/components/admin/StatusBadge'
import { OrderDetailActions } from '@/components/admin/OrderDetailActions'

export const dynamic = 'force-dynamic'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: true,
      events: { orderBy: { receivedAt: 'asc' } },
    },
  })

  if (!order) {
    notFound()
  }

  const trackingMeta = extractOrderTrackingMeta(order, order.events)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
          >
            ← Back to Orders
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-[-0.03em]">
              {order.reference}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-[#6a6a6a]">
            Created {formatLagosDate(order.createdAt)}
            {order.paidAt ? ` · Paid ${formatLagosDate(order.paidAt)}` : ''}
          </p>
        </div>

        <OrderDetailActions
          orderId={order.id}
          reference={order.reference}
          status={order.status}
          currentEstimatedDelivery={trackingMeta.estimatedDelivery}
        />
      </div>

      {/* 5-Stage Order Delivery Status Stepper */}
      <div className="border border-[#e2e2de] bg-white p-6">
        <OrderStatusStepper status={order.status} trackingMeta={trackingMeta} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Line items */}
        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-8 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
              Order Items (Price &amp; Size Snapshots)
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e2e2de] text-[11px] uppercase text-[#6a6a6a]">
                  <tr>
                    <th className="pb-2.5 font-medium">Product Snapshot</th>
                    <th className="pb-2.5 font-medium">Size</th>
                    <th className="pb-2.5 font-medium text-right">Unit Price</th>
                    <th className="pb-2.5 font-medium text-right">Qty</th>
                    <th className="pb-2.5 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium text-[#030304]">
                        {item.productNameSnap}
                      </td>
                      <td className="py-3 text-[#4a4a4a]">{item.sizeSnap}</td>
                      <td className="py-3 text-right text-[#4a4a4a]">
                        {formatNaira(item.unitPriceKobo)}
                      </td>
                      <td className="py-3 text-right text-[#4a4a4a]">{item.qty}</td>
                      <td className="py-3 text-right font-semibold text-[#030304]">
                        {formatNaira(item.unitPriceKobo * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-[#e2e2de] pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4a4a4a]">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotalKobo)}</span>
              </div>
              <div className="flex justify-between text-[#4a4a4a]">
                <span>Shipping</span>
                <span>{formatNaira(order.shippingKobo)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#e2e2de] text-sm font-bold text-[#030304]">
                <span>Total</span>
                <span>{formatNaira(order.totalKobo)}</span>
              </div>
            </div>
          </div>

          {/* Payment Events Timeline */}
          <div className="border-t border-[#e2e2de] pt-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
              Payment &amp; Audit Timeline
            </h2>
            {order.events.length > 0 ? (
              <ol className="mt-4 space-y-4">
                {order.events.map((evt) => (
                  <li
                    key={evt.id}
                    className="border-l-2 border-[#030304] bg-[#fafaf8] pl-4 pr-3 py-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-[#030304]">
                        {evt.type}
                      </span>
                      <span className="text-[11px] text-[#6a6a6a]">
                        {formatLagosDate(evt.receivedAt)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-[#757575]">
                      Event ID: {evt.paystackEventId}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-[#4a4a4a] underline underline-offset-4">
                        Inspect raw payload (admin-only)
                      </summary>
                      <pre className="mt-2 max-h-56 overflow-auto bg-[#030304] p-3 text-[11px] text-neutral-100">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </details>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-[#757575]">
                No payment or admin events recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <aside className="border border-[#e2e2de] bg-white p-6 lg:col-span-4 space-y-5 self-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">Customer</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">
              {order.user?.name || order.customerEmail}
            </h2>
            <p className="text-xs text-[#4a4a4a]">{order.customerEmail}</p>
            {order.customerPhone ? (
              <p className="mt-1 text-xs font-medium text-[#030304]">{order.customerPhone}</p>
            ) : null}
            {order.user ? (
              <Link
                href={`/admin/users/${order.user.id}`}
                className="mt-2 inline-block text-xs underline underline-offset-4 hover:text-[#ff5331]"
              >
                View customer profile →
              </Link>
            ) : null}
          </div>

          <div className="border-t border-[#ecece8] pt-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Shipping Destination
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#030304]">
              {formatShippingAddress(order.shippingAddress)}
            </p>
          </div>

          <div className="border-t border-[#ecece8] pt-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Paystack Reference
            </p>
            <p className="mt-1 font-mono text-xs text-[#030304]">
              {order.paystackRef || '—'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
