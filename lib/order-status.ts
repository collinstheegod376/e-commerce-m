/**
 * Shared Order Tracking & Status Pipeline definitions for Maison Kriss.
 *
 * 5-Stage Customer & Admin Order Lifecycle:
 *   1. paid                  -> "Paid"
 *   2. waiting_confirmation  -> "Waiting for Confirmation"
 *   3. confirmed             -> "Confirmed"
 *   4. sent_out              -> "Sent Out"
 *   5. delivered             -> "Delivered"
 *
 * Legacy status "fulfilled" is treated as equivalent to "delivered" for backward compatibility.
 */

export const ORDER_TRACKING_STAGES = [
  {
    key: 'paid',
    label: 'Paid',
    shortLabel: 'Order Paid',
    description: 'Payment received and verified.',
  },
  {
    key: 'waiting_confirmation',
    label: 'Waiting for Confirmation',
    shortLabel: 'Awaiting Review',
    description: 'Your order is in queue for Lagos studio review.',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    shortLabel: 'Order Confirmed',
    description: 'Studio confirmed your order and is preparing your pieces.',
  },
  {
    key: 'sent_out',
    label: 'Sent Out',
    shortLabel: 'Order Shipped',
    description: 'Dispatched with our courier and on the way to you.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    shortLabel: 'Order Delivered',
    description: 'Your order has arrived at your destination.',
  },
] as const

export type OrderTrackingStageKey = (typeof ORDER_TRACKING_STAGES)[number]['key']

export type AllOrderStatus =
  | 'pending'
  | OrderTrackingStageKey
  | 'fulfilled'
  | 'failed'
  | 'abandoned'
  | 'cancelled'
  | 'refunded'

export const REALIZED_REVENUE_STATUSES = [
  'paid',
  'waiting_confirmation',
  'confirmed',
  'sent_out',
  'delivered',
  'fulfilled',
] as const

export const STATUS_DISPLAY_LABELS: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  waiting_confirmation: 'Waiting for Confirmation',
  confirmed: 'Confirmed',
  sent_out: 'Sent Out',
  delivered: 'Delivered',
  fulfilled: 'Delivered',
  failed: 'Failed',
  abandoned: 'Abandoned',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function getStatusLabel(status: string): string {
  return STATUS_DISPLAY_LABELS[status] ?? status.replace(/_/g, ' ')
}

export function normalizeTrackingStatus(status: string): OrderTrackingStageKey | null {
  if (status === 'fulfilled') return 'delivered'
  if (
    status === 'paid' ||
    status === 'waiting_confirmation' ||
    status === 'confirmed' ||
    status === 'sent_out' ||
    status === 'delivered'
  ) {
    return status
  }
  return null
}

export function getStageIndex(status: string): number {
  const normalized = normalizeTrackingStatus(status)
  if (!normalized) return -1
  return ORDER_TRACKING_STAGES.findIndex((s) => s.key === normalized)
}

export interface OrderTrackingTimestamps {
  paidAt?: string | null
  waitingConfirmationAt?: string | null
  confirmedAt?: string | null
  sentOutAt?: string | null
  deliveredAt?: string | null
  estimatedDelivery?: string | null
}

export interface OrderEventLike {
  type: string
  receivedAt: string | Date
  payload?: unknown
}

/**
 * Extracts per-stage timestamps and optional estimatedDelivery date from Order.paidAt
 * and PaymentEvent audit records (without needing extra DB columns).
 */
export function extractOrderTrackingMeta(
  order: { paidAt?: string | Date | null; createdAt?: string | Date },
  events: OrderEventLike[] = [],
): OrderTrackingTimestamps {
  const toIso = (val?: string | Date | null): string | null => {
    if (!val) return null
    const d = val instanceof Date ? val : new Date(val)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const meta: OrderTrackingTimestamps = {
    paidAt: toIso(order.paidAt),
    waitingConfirmationAt: null,
    confirmedAt: null,
    sentOutAt: null,
    deliveredAt: null,
    estimatedDelivery: null,
  }

  for (const evt of events) {
    const ts = toIso(evt.receivedAt)
    const payload =
      evt.payload && typeof evt.payload === 'object'
        ? (evt.payload as Record<string, unknown>)
        : null

    if (payload && typeof payload.estimatedDelivery === 'string' && payload.estimatedDelivery.trim()) {
      meta.estimatedDelivery = payload.estimatedDelivery.trim()
    }

    if (evt.type === 'charge.success' || evt.type === 'verify.charge.success' || evt.type === 'admin.order.paid') {
      if (!meta.paidAt) meta.paidAt = ts
    } else if (evt.type === 'admin.order.waiting_confirmation') {
      meta.waitingConfirmationAt = ts
    } else if (evt.type === 'admin.order.confirmed') {
      meta.confirmedAt = ts
    } else if (evt.type === 'admin.order.sent_out') {
      meta.sentOutAt = ts
    } else if (evt.type === 'admin.order.delivered' || evt.type === 'admin.order.fulfilled') {
      meta.deliveredAt = ts
    }
  }

  return meta
}
