'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react'
import { formatLagosDate, formatNaira } from '@/lib/money'
import { getStatusLabel, type OrderTrackingTimestamps } from '@/lib/order-status'
import { OrderStatusStepper, StatusBadge } from '@/components/admin/StatusBadge'

export interface AdminOrderRowItem {
  id: string
  productNameSnap: string
  sizeSnap: string
  unitPriceKobo: number
  qty: number
}

export interface AdminOrderRowData {
  id: string
  reference: string
  status: string
  createdAt: string
  paidAt: string | null
  subtotalKobo: number
  shippingKobo: number
  totalKobo: number
  customerEmail: string
  customerPhone: string | null
  customerName: string | null
  shippingAddressFormatted: string
  itemCount: number
  items: AdminOrderRowItem[]
  trackingMeta: OrderTrackingTimestamps
}

const ADMIN_STATUS_SELECT_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'waiting_confirmation', label: 'Waiting for Confirmation' },
  { value: 'confirmed', label: 'Confirmed (Emails Customer)' },
  { value: 'sent_out', label: 'Sent Out (Emails Customer)' },
  { value: 'delivered', label: 'Delivered (Emails Customer)' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded (Paystack Refund)' },
] as const

function getQuickNextAction(status: string): {
  nextStatus: string
  label: string
  sendsEmail: boolean
} | null {
  if (status === 'pending' || status === 'failed') {
    return { nextStatus: 'paid', label: 'Mark as Paid', sendsEmail: true }
  }
  if (status === 'paid' || status === 'waiting_confirmation') {
    return { nextStatus: 'confirmed', label: 'Mark as Confirmed', sendsEmail: true }
  }
  if (status === 'confirmed') {
    return { nextStatus: 'sent_out', label: 'Mark as Sent Out', sendsEmail: true }
  }
  if (status === 'sent_out') {
    return { nextStatus: 'delivered', label: 'Mark as Delivered', sendsEmail: true }
  }
  return null
}

function statusSendsEmail(nextStatus: string, prevStatus: string): boolean {
  if (nextStatus === 'confirmed' || nextStatus === 'sent_out' || nextStatus === 'delivered') {
    return true
  }
  if (nextStatus === 'paid' && (prevStatus === 'pending' || prevStatus === 'failed')) {
    return true
  }
  return false
}

function ExpandedOrderDrawer({ order }: { order: AdminOrderRowData }) {
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState(order.status)
  const [liveTrackingMeta, setLiveTrackingMeta] = useState<OrderTrackingTimestamps>(
    order.trackingMeta,
  )
  const [selectedStatus, setSelectedStatus] = useState(
    order.status === 'fulfilled'
      ? 'delivered'
      : ADMIN_STATUS_SELECT_OPTIONS.some((o) => o.value === order.status)
        ? order.status
        : 'confirmed',
  )
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.trackingMeta.estimatedDelivery ?? '',
  )
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const quickAction = getQuickNextAction(liveStatus)

  async function submitStatusUpdate(targetStatus: string) {
    setBusy(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          note: note.trim() || undefined,
          estimatedDelivery: estimatedDelivery.trim() || undefined,
        }),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'Could not update order status.',
        })
        setBusy(false)
        return
      }

      const emailSent = statusSendsEmail(targetStatus, liveStatus)
      const nowIso = new Date().toISOString()

      setLiveStatus(targetStatus)
      setSelectedStatus(targetStatus)
      setLiveTrackingMeta((prev) => ({
        ...prev,
        paidAt: targetStatus === 'paid' && !prev.paidAt ? nowIso : prev.paidAt,
        waitingConfirmationAt:
          targetStatus === 'waiting_confirmation' ? nowIso : prev.waitingConfirmationAt,
        confirmedAt: targetStatus === 'confirmed' ? nowIso : prev.confirmedAt,
        sentOutAt: targetStatus === 'sent_out' ? nowIso : prev.sentOutAt,
        deliveredAt: targetStatus === 'delivered' ? nowIso : prev.deliveredAt,
        estimatedDelivery: estimatedDelivery.trim() || prev.estimatedDelivery,
      }))
      setNote('')

      setFeedback({
        type: 'success',
        message: emailSent
          ? `Status updated to ${getStatusLabel(targetStatus)} · Customer email sent`
          : `Status updated to ${getStatusLabel(targetStatus)}`,
      })
      router.refresh()
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error while updating order status.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-[#e2e2de] bg-[#fafaf8] px-5 py-5 space-y-5">
      {/* Top: 5-stage visual delivery status stepper */}
      <div className="border border-[#e2e2de] bg-white p-4">
        <OrderStatusStepper
          status={liveStatus}
          trackingMeta={liveTrackingMeta}
          compact
        />
      </div>

      {/* Main 2-column content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Interactive Admin Status Controls */}
        <div className="border border-[#e2e2de] bg-white p-4 lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0ec] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-[#030304]">
                Order Status Controls
              </h3>
              <p className="mt-0.5 text-[11px] text-[#6a6a6a]">
                Advance to the next stage or move to any status below.
              </p>
            </div>
            <StatusBadge status={liveStatus} />
          </div>

          {/* Quick primary "Next Step" CTA */}
          {quickAction ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50/70 px-3.5 py-3">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-900">
                  Recommended Next Step
                </p>
                <p className="text-[11px] text-amber-800/90">
                  {quickAction.sendsEmail
                    ? 'Updates order status and emails the customer automatically.'
                    : 'Updates order status in the fulfillment pipeline.'}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => submitStatusUpdate(quickAction.nextStatus)}
                className="inline-flex items-center gap-1.5 bg-[#030304] px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#ff660c] disabled:opacity-50"
              >
                {busy ? 'Updating…' : quickAction.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {/* Full status selector + optional estimatedDelivery + optional note */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submitStatusUpdate(selectedStatus)
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#6a6a6a]">
                  Set Status (Any Stage)
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={busy}
                  className="mt-1 w-full border border-[#d6d6d6] bg-white px-3 py-2 text-xs text-[#030304] outline-none focus:border-[#030304]"
                >
                  {ADMIN_STATUS_SELECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#6a6a6a]">
                  Estimated Delivery (Optional)
                </span>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  disabled={busy}
                  placeholder="Expected Jan 27 Wednesday"
                  maxLength={120}
                  className="mt-1 w-full border border-[#d6d6d6] bg-white px-3 py-2 text-xs text-[#030304] outline-none focus:border-[#030304]"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#6a6a6a]">
                Internal / Courier Note (Optional)
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
                placeholder="Courier tracking ID, dispatch note, or reason…"
                maxLength={300}
                className="mt-1 w-full border border-[#d6d6d6] bg-white px-3 py-2 text-xs text-[#030304] outline-none focus:border-[#030304]"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6a6a6a]">
                {statusSendsEmail(selectedStatus, liveStatus) ? (
                  <>
                    <Mail className="h-3.5 w-3.5 text-indigo-600" />
                    Sends status email to {order.customerEmail}
                  </>
                ) : selectedStatus === 'refunded' ? (
                  'Initiates Paystack refund for this transaction'
                ) : (
                  'Records audit entry in order timeline'
                )}
              </span>

              <button
                type="submit"
                disabled={busy}
                className="border border-[#030304] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#030304] transition-colors hover:bg-[#030304] hover:text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Update Status'}
              </button>
            </div>
          </form>

          {/* Immediate Feedback Banner */}
          {feedback ? (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`flex items-center gap-2 border-l-2 px-3 py-2 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : 'border-[#ff5331] bg-[#fff5f2] text-[#030304]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : null}
              <span>{feedback.message}</span>
            </div>
          ) : null}
        </div>

        {/* Right: Customer, Shipping & Itemized Order Details */}
        <div className="border border-[#e2e2de] bg-white p-4 lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Customer & Address */}
            <div className="space-y-2 border-b border-[#f0f0ec] pb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-[#030304]">
                  Customer &amp; Delivery
                </h3>
                {order.paidAt ? (
                  <span className="text-[11px] text-[#6a6a6a]">
                    Paid {formatLagosDate(order.paidAt)}
                  </span>
                ) : null}
              </div>

              <div className="space-y-1 text-xs text-[#4a4a4a]">
                <p className="flex items-center gap-1.5 font-medium text-[#030304]">
                  <User className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" />
                  {order.customerName || order.customerEmail}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" />
                  {order.customerEmail}
                </p>
                {order.customerPhone ? (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" />
                    {order.customerPhone}
                  </p>
                ) : null}
                <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-relaxed text-[#4a4a4a]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" />
                  <span>{order.shippingAddressFormatted}</span>
                </p>
              </div>
            </div>

            {/* Itemized Order Table */}
            <div>
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6a6a6a]">
                <Package className="h-3.5 w-3.5" />
                Items ({order.itemCount})
              </h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#ecece8] text-[10px] uppercase text-[#757575]">
                    <tr>
                      <th className="pb-1.5 font-medium">Product</th>
                      <th className="pb-1.5 font-medium">Size</th>
                      <th className="pb-1.5 font-medium text-right">Qty</th>
                      <th className="pb-1.5 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f4f0]">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 pr-2 font-medium text-[#030304]">
                          {item.productNameSnap}
                        </td>
                        <td className="py-1.5 pr-2 text-[#4a4a4a]">{item.sizeSnap}</td>
                        <td className="py-1.5 pr-2 text-right text-[#4a4a4a]">{item.qty}</td>
                        <td className="py-1.5 text-right font-medium text-[#030304]">
                          {formatNaira(item.unitPriceKobo * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2.5 space-y-1 border-t border-[#ecece8] pt-2 text-[11px]">
                <div className="flex justify-between text-[#6a6a6a]">
                  <span>Subtotal</span>
                  <span>{formatNaira(order.subtotalKobo)}</span>
                </div>
                <div className="flex justify-between text-[#6a6a6a]">
                  <span>Shipping</span>
                  <span>{formatNaira(order.shippingKobo)}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs font-bold text-[#030304]">
                  <span>Total</span>
                  <span>{formatNaira(order.totalKobo)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Audit Page Link */}
          <div className="border-t border-[#f0f0ec] pt-3">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#030304] underline underline-offset-4 transition-colors hover:text-[#ff660c]"
            >
              Open Full Audit Page →
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminOrdersTableClient({ orders }: { orders: AdminOrderRowData[] }) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  function toggleRow(orderId: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#e2e2de] bg-[#fafaf8] text-[11px] uppercase text-[#6a6a6a]">
          <tr>
            <th className="w-10 px-3 py-3.5 font-medium" aria-label="Expand row" />
            <th className="px-4 py-3.5 font-medium">Reference</th>
            <th className="px-4 py-3.5 font-medium">Date (WAT)</th>
            <th className="px-4 py-3.5 font-medium">Customer</th>
            <th className="px-4 py-3.5 font-medium">Items</th>
            <th className="px-4 py-3.5 font-medium text-right">Total</th>
            <th className="px-5 py-3.5 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0ec]">
          {orders.length > 0 ? (
            orders.map((order) => {
              const isExpanded = Boolean(expandedIds[order.id])
              return (
                <Fragment key={order.id}>
                  <tr
                    onClick={() => toggleRow(order.id)}
                    className={`cursor-pointer transition-colors ${
                      isExpanded ? 'bg-[#fafaf8]' : 'hover:bg-[#fafaf8]'
                    }`}
                  >
                    <td className="px-3 py-3.5 text-center">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order ${order.reference}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRow(order.id)
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-[#6a6a6a] transition-colors hover:bg-[#ecece8] hover:text-[#030304]"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-[#030304]' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="underline underline-offset-4 hover:text-[#ff5331]"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[#4a4a4a]">
                      {formatLagosDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#030304]">
                        {order.customerName || order.customerEmail}
                      </div>
                      <div className="text-[11px] text-[#757575]">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[#4a4a4a]">{order.itemCount}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-[#030304]">
                      {formatNaira(order.totalKobo)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>

                  {isExpanded ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <ExpandedOrderDrawer order={order} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-[#757575]">
                No orders match your current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
