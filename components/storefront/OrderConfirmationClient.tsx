'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { formatLagosDate, formatNaira } from '@/lib/money'
import { type OrderTrackingTimestamps, getStatusLabel } from '@/lib/order-status'
import { OrderTrackingStepper } from '@/components/storefront/OrderTrackingStepper'

export interface ConfirmationOrderItem {
  id: string
  productNameSnap: string
  sizeSnap: string
  unitPriceKobo: number
  qty: number
}

export interface ConfirmationOrderData {
  id: string
  reference: string
  status: string
  customerEmail: string
  customerPhone: string | null
  subtotalKobo: number
  shippingKobo: number
  totalKobo: number
  shippingAddressText: string
  createdAt: string
  paidAt: string | null
  items: ConfirmationOrderItem[]
  trackingMeta: OrderTrackingTimestamps
}

interface OrderConfirmationClientProps {
  order: ConfirmationOrderData
}

const MAX_POLL_ATTEMPTS = 6
const POLL_INTERVAL_MS = 2500

export function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState(order.status)
  const [isPolling, setIsPolling] = useState(order.status === 'pending')
  const [pollCount, setPollCount] = useState(0)
  const [manualChecking, setManualChecking] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)

  useEffect(() => {
    setLiveStatus(order.status)
    if (order.status !== 'pending') {
      setIsPolling(false)
    }
  }, [order.status])

  // Poll GET /api/orders/[reference]/status every 2.5s up to 6 times while pending
  useEffect(() => {
    if (liveStatus !== 'pending' || !isPolling) return

    let cancelled = false
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    async function checkStatus() {
      if (cancelled) return
      attempts += 1
      setPollCount(attempts)

      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(order.reference)}/status`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const data = (await res.json()) as { status?: string }
          if (!cancelled && data.status && data.status !== 'pending') {
            setLiveStatus(data.status)
            setIsPolling(false)
            if (data.status === 'paid') {
              window.dispatchEvent(
                new CustomEvent('mk:cart-updated', { detail: { count: 0 } }),
              )
            }
            router.refresh()
            return
          }
        }
      } catch {
        // Ignore transient network errors and continue until max attempts
      }

      if (!cancelled) {
        if (attempts < MAX_POLL_ATTEMPTS) {
          timeoutId = setTimeout(checkStatus, POLL_INTERVAL_MS)
        } else {
          setIsPolling(false)
        }
      }
    }

    timeoutId = setTimeout(checkStatus, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [liveStatus, isPolling, order.reference, router])

  async function handleManualRecheck() {
    setManualChecking(true)
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.reference)}/status`,
        { cache: 'no-store' },
      )
      if (res.ok) {
        const data = (await res.json()) as { status?: string }
        if (data.status) {
          setLiveStatus(data.status)
          if (data.status === 'paid') {
            window.dispatchEvent(
              new CustomEvent('mk:cart-updated', { detail: { count: 0 } }),
            )
          }
          router.refresh()
        }
      }
    } finally {
      setManualChecking(false)
    }
  }

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(order.reference)
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
    } catch {
      // Clipboard unavailable
    }
  }

  const isPending = liveStatus === 'pending'
  const isFailed =
    liveStatus === 'failed' ||
    liveStatus === 'cancelled' ||
    liveStatus === 'abandoned'

  const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 sm:space-y-8 animate-mk-fade-up">
      {/* Celebratory Hero Confirmation Card */}
      <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#ff660c]/30 bg-[#041b26] p-4 shadow-2xl sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#ff660c]/12 blur-3xl"
        />

        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border sm:h-12 sm:w-12 ${
                  isPending
                    ? 'border-[#ff660c]/50 bg-[#ff660c]/15 text-[#ff660c]'
                    : isFailed
                      ? 'border-red-500/40 bg-red-500/15 text-red-400'
                      : 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_24px_rgba(255,102,12,0.4)]'
                }`}
              >
                {isPending ? (
                  isPolling ? (
                    <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  )
                ) : (
                  <CheckCircle2 className="h-5 w-5 stroke-[2.25] sm:h-6 sm:w-6" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="break-words text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff660c]">
                  {isPending
                    ? 'Verifying Payment'
                    : isFailed
                      ? 'Order Update'
                      : 'Order Confirmed · Maison Kriss'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Status:{' '}
                  <span className="font-semibold text-[#f8fafc]">
                    {getStatusLabel(liveStatus)}
                  </span>
                </p>
              </div>
            </div>

            <h1 className="break-words font-brush text-2xl uppercase leading-tight tracking-wide text-[#f8fafc] sm:text-5xl sm:leading-none">
              {isPending
                ? 'Confirming Your Order'
                : isFailed
                  ? 'Payment Not Completed'
                  : 'Thank You for Your Order'}
            </h1>

            <p className="max-w-2xl break-words text-sm leading-relaxed text-slate-300 sm:text-base">
              {isPending
                ? 'We are confirming your Paystack transaction right now. This page updates automatically as soon as payment clears.'
                : isFailed
                  ? 'It looks like this payment did not go through. No items have been dispatched — you can return to your cart to retry checkout.'
                  : 'We have received your order and our Lagos studio team is on it. Track every milestone below or anytime from your Profile page.'}
            </p>

            {/* Email Receipt Notice */}
            {!isFailed ? (
              <div className="flex max-w-full items-start gap-2 rounded-lg border border-white/10 bg-[#01121a]/80 px-3 py-2.5 text-xs text-slate-300 sm:inline-flex sm:items-center sm:px-3.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#ff660c] sm:mt-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {isPending
                    ? 'A receipt will be sent to '
                    : 'An email receipt has been sent to '}
                  <strong className="break-all font-semibold text-[#f8fafc]">
                    {order.customerEmail}
                  </strong>
                </span>
              </div>
            ) : null}

            {/* Live Verification Status Bar when Pending */}
            {isPending ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isPolling ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-[#ff8a47]">
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                    Checking Paystack confirmation ({pollCount}/{MAX_POLL_ATTEMPTS})…
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualRecheck}
                    disabled={manualChecking}
                    className="inline-flex items-center gap-2 rounded-md border border-[#ff660c]/60 bg-[#ff660c]/15 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff660c] transition-colors hover:bg-[#ff660c] hover:text-[#01121a] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 shrink-0 ${manualChecking ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    {manualChecking ? 'Checking…' : 'Check Payment Status'}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Order Reference Chip */}
          <div className="w-full min-w-0 rounded-xl border border-white/12 bg-[#01121a]/90 p-3.5 sm:w-auto sm:min-w-[220px] sm:shrink-0 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Order Reference
            </p>
            <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 break-all font-mono text-xs font-bold text-[#ff660c] sm:text-sm">
                {order.reference}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                aria-label="Copy order reference"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/15 bg-[#041b26] text-slate-300 transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
              >
                {copiedRef ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {formatLagosDate(order.paidAt || order.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Live Order Delivery Status Stepper */}
      <OrderTrackingStepper
        status={liveStatus}
        timestamps={order.trackingMeta}
        theme="dark"
      />

      {/* Order Summary & Itemized Receipt */}
      <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/12 bg-[#041b26] p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Package className="h-5 w-5 shrink-0 text-[#ff660c]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#f8fafc]">
              Order Summary
            </h2>
          </div>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff660c]">
            {totalUnits} {totalUnits === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="mt-5 grid min-w-0 gap-4 border-b border-white/10 pb-6 sm:grid-cols-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Order Date
            </p>
            <p className="mt-1 break-words text-sm font-medium text-[#f8fafc]">
              {formatLagosDate(order.createdAt)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Contact Email
            </p>
            <p className="mt-1 break-all text-sm font-medium text-[#f8fafc]">
              {order.customerEmail}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <MapPin className="h-3 w-3 shrink-0 text-[#ff660c]" aria-hidden="true" />
              Delivery Address
            </p>
            <p className="mt-1 break-words text-sm font-medium leading-snug text-[#f8fafc]">
              {order.shippingAddressText}
            </p>
          </div>
        </div>

        {/* Itemized List */}
        <div className="mt-5 divide-y divide-white/10">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 flex-col gap-1.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-display text-sm font-semibold text-[#f8fafc] sm:text-base">
                  {item.productNameSnap}
                </p>
                <p className="mt-0.5 break-words text-xs uppercase tracking-[0.12em] text-slate-400">
                  Size {item.sizeSnap} · Qty {item.qty} · {formatNaira(item.unitPriceKobo)} each
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#f8fafc] sm:text-right">
                {formatNaira(item.unitPriceKobo * item.qty)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals Breakdown */}
        <div className="mt-5 space-y-2.5 border-t border-white/12 pt-5 text-sm">
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span>Subtotal</span>
            <span className="shrink-0">{formatNaira(order.subtotalKobo)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span>Shipping</span>
            <span className="shrink-0">
              {order.shippingKobo === 0 ? 'Complimentary' : formatNaira(order.shippingKobo)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3.5 text-base font-bold text-[#f8fafc]">
            <span>{isPending ? 'Total Due' : 'Total Paid'}</span>
            <span className="shrink-0 text-lg text-[#ff660c]">{formatNaira(order.totalKobo)}</span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/profile"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff660c] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#01121a] transition-all hover:-translate-y-0.5 hover:bg-[#ff7a2e] hover:shadow-[0_10px_25px_rgba(255,102,12,0.3)] sm:w-auto"
        >
          <span>View Order History</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/18 bg-[#041b26] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#f8fafc] transition-all hover:border-[#ff660c] hover:text-[#ff660c] sm:w-auto"
        >
          <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  )
}
