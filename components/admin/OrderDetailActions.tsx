'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { getStatusLabel } from '@/lib/order-status'

interface OrderDetailActionsProps {
  orderId: string
  reference: string
  status: string
  currentEstimatedDelivery?: string | null
}

type AdminActionStatus =
  | 'paid'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'sent_out'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

const ACTION_OPTIONS: Array<{ value: AdminActionStatus; label: string }> = [
  { value: 'paid', label: 'Paid' },
  { value: 'waiting_confirmation', label: 'Waiting for Confirmation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'sent_out', label: 'Sent Out' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

function getNextStageAction(status: string): {
  target: AdminActionStatus
  label: string
} | null {
  if (status === 'pending' || status === 'failed') {
    return { target: 'paid', label: 'Mark as Paid' }
  }
  if (status === 'paid' || status === 'waiting_confirmation') {
    return { target: 'confirmed', label: 'Mark as Confirmed' }
  }
  if (status === 'confirmed') {
    return { target: 'sent_out', label: 'Mark as Sent Out' }
  }
  if (status === 'sent_out') {
    return { target: 'delivered', label: 'Mark as Delivered' }
  }
  return null
}

function willSendCustomerEmail(target: AdminActionStatus, currentStatus: string): boolean {
  if (target === 'confirmed' || target === 'sent_out' || target === 'delivered') {
    return true
  }
  if (target === 'paid' && (currentStatus === 'pending' || currentStatus === 'failed')) {
    return true
  }
  return false
}

export function OrderDetailActions({
  orderId,
  reference,
  status,
  currentEstimatedDelivery,
}: OrderDetailActionsProps) {
  const router = useRouter()
  const nextStage = getNextStageAction(status)
  const [selectedStatus, setSelectedStatus] = useState<AdminActionStatus>(
    nextStage?.target ??
      (ACTION_OPTIONS.some((o) => o.value === status)
        ? (status as AdminActionStatus)
        : 'confirmed'),
  )
  const [confirmAction, setConfirmAction] = useState<AdminActionStatus | null>(null)
  const [estimatedDelivery, setEstimatedDelivery] = useState(currentEstimatedDelivery ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function openConfirm(target: AdminActionStatus) {
    setError('')
    setSuccessMsg('')
    setConfirmAction(target)
  }

  async function executeAction() {
    if (!confirmAction) return
    setBusy(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: confirmAction,
          note: note.trim() || undefined,
          estimatedDelivery: estimatedDelivery.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not update order status.')
        setBusy(false)
        return
      }

      const emailSent = willSendCustomerEmail(confirmAction, status)
      const label = getStatusLabel(confirmAction)
      setConfirmAction(null)
      setNote('')
      setSuccessMsg(
        emailSent
          ? `Status updated to ${label} · Customer email sent`
          : `Status updated to ${label}`,
      )
      router.refresh()
    } catch {
      setError('Network error while updating order.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Primary Next Step CTA */}
        {nextStage ? (
          <button
            type="button"
            onClick={() => openConfirm(nextStage.target)}
            className="inline-flex items-center gap-1.5 bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#ff660c]"
          >
            {nextStage.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {/* Full Status Selector (forward or backward) */}
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Select target order status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AdminActionStatus)}
            className="border border-[#d6d6d6] bg-white px-3 py-2 text-xs text-[#030304] outline-none focus:border-[#030304]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => openConfirm(selectedStatus)}
            className="border border-[#030304] bg-white px-3.5 py-2 text-xs font-medium uppercase tracking-[0.06em] text-[#030304] transition-colors hover:bg-[#030304] hover:text-white"
          >
            Update Status
          </button>
        </div>
      </div>

      {successMsg ? (
        <div
          role="status"
          className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {error && !confirmAction ? (
        <div
          role="alert"
          className="border-l-2 border-[#ff5331] bg-[#fff5f2] px-3 py-2 text-xs text-[#030304]"
        >
          {error}
        </div>
      ) : null}

      {/* Confirmation Dialog */}
      {confirmAction ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md border border-[#030304] bg-white p-6 shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#ff5331]">
              Confirm Order Status Update
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-[-0.03em]">
              {confirmAction === 'refunded'
                ? 'Issue Paystack refund?'
                : confirmAction === 'cancelled'
                  ? 'Cancel this order?'
                  : `Move order to ${getStatusLabel(confirmAction)}?`}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4a4a4a]">
              Order <strong className="font-mono">{reference}</strong> will transition from{' '}
              <strong>{getStatusLabel(status)}</strong> to{' '}
              <strong>{getStatusLabel(confirmAction)}</strong>, and an audit entry will be recorded
              in the payment events timeline.
            </p>

            {/* Customer Email Notification Callout */}
            {willSendCustomerEmail(confirmAction, status) ? (
              <div className="mt-3 flex items-start gap-2 border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs text-indigo-900">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <span>
                  An automatic <strong>{getStatusLabel(confirmAction)}</strong> email notification
                  will be sent to the customer.
                </span>
              </div>
            ) : null}

            {/* Optional Estimated Delivery */}
            {confirmAction !== 'cancelled' && confirmAction !== 'refunded' ? (
              <label className="mt-4 block">
                <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                  Estimated Delivery (optional)
                </span>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  placeholder="Expected Jan 27 Wednesday"
                  maxLength={120}
                  className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
                />
              </label>
            ) : null}

            {/* Optional Note */}
            <label className="mt-3 block">
              <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                Internal / Courier Note (optional)
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Courier tracking ID, dispatch details, or reason…"
                maxLength={300}
                className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
            </label>

            {error ? <p className="mt-3 text-xs text-[#ff5331]">{error}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmAction(null)}
                className="border border-[#d6d6d6] px-4 py-2 text-xs text-[#4a4a4a] hover:border-[#030304]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={executeAction}
                className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] disabled:opacity-50"
              >
                {busy ? 'Processing…' : `Confirm ${getStatusLabel(confirmAction)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
