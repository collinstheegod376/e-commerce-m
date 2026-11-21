'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OrderDetailActionsProps {
  orderId: string
  reference: string
  status: string
}

type PendingAction = 'fulfilled' | 'cancelled' | 'refunded' | null

export function OrderDetailActions({
  orderId,
  reference,
  status,
}: OrderDetailActionsProps) {
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<PendingAction>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const canFulfill = status === 'paid'
  const canCancel = status === 'pending' || status === 'failed'
  const canRefund = status === 'paid' || status === 'fulfilled'

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
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not update order status.')
        setBusy(false)
        return
      }
      setConfirmAction(null)
      setNote('')
      router.refresh()
    } catch {
      setError('Network error while updating order.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canFulfill ? (
          <button
            type="button"
            onClick={() => {
              setError('')
              setConfirmAction('fulfilled')
            }}
            className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
          >
            Mark Fulfilled
          </button>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={() => {
              setError('')
              setConfirmAction('cancelled')
            }}
            className="border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-red-700 hover:border-red-600"
          >
            Mark Cancelled
          </button>
        ) : null}

        {canRefund ? (
          <button
            type="button"
            onClick={() => {
              setError('')
              setConfirmAction('refunded')
            }}
            className="border border-[#d6d6d6] bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-[#030304] hover:border-[#030304]"
          >
            Issue Refund
          </button>
        ) : null}

        {!canFulfill && !canCancel && !canRefund ? (
          <span className="text-xs text-[#757575]">No actions available for status &ldquo;{status}&rdquo;.</span>
        ) : null}
      </div>

      {error ? (
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
              Confirm Order Action
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-[-0.03em]">
              {confirmAction === 'fulfilled'
                ? 'Mark order as fulfilled?'
                : confirmAction === 'cancelled'
                  ? 'Cancel this order?'
                  : 'Issue Paystack refund?'}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4a4a4a]">
              Order <strong className="font-mono">{reference}</strong> will transition from{' '}
              <strong>{status}</strong> to <strong>{confirmAction}</strong>, and an audit entry
              will be recorded in the payment events timeline.
            </p>

            <label className="mt-4 block">
              <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                Internal Note (optional)
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Courier tracking ID or reason…"
                className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
            </label>

            {error ? (
              <p className="mt-3 text-xs text-[#ff5331]">{error}</p>
            ) : null}

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
                {busy ? 'Processing…' : `Confirm ${confirmAction}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
