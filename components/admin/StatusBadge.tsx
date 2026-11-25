import { AlertCircle, Check, Clock, Truck } from 'lucide-react'
import {
  ORDER_TRACKING_STAGES,
  getStageIndex,
  getStatusLabel,
  type OrderTrackingTimestamps,
} from '@/lib/order-status'
import { formatLagosDay } from '@/lib/money'

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  waiting_confirmation: 'bg-amber-50 text-amber-800 border-amber-300',
  confirmed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  sent_out: 'bg-purple-50 text-purple-800 border-purple-200',
  delivered: 'bg-[#030304] text-white border-[#030304]',
  fulfilled: 'bg-[#030304] text-white border-[#030304]',
  pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  abandoned: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  refunded: 'bg-orange-50 text-orange-800 border-orange-200',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700 border-neutral-200'
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] ${cls}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

interface OrderStatusStepperProps {
  status: string
  trackingMeta: OrderTrackingTimestamps
  compact?: boolean
}

export function OrderStatusStepper({
  status,
  trackingMeta,
  compact = false,
}: OrderStatusStepperProps) {
  const stageIdx = getStageIndex(status)
  const isTerminalOffTrack = stageIdx === -1

  function getStageDateLabel(stageKey: string, idx: number): string {
    if (stageKey === 'paid') {
      return trackingMeta.paidAt ? formatLagosDay(trackingMeta.paidAt) : '—'
    }
    if (stageKey === 'waiting_confirmation') {
      if (trackingMeta.waitingConfirmationAt) {
        return formatLagosDay(trackingMeta.waitingConfirmationAt)
      }
      if (stageIdx >= 2) return 'Reviewed'
      if (stageIdx === 0 || stageIdx === 1) return 'In Queue'
      return '—'
    }
    if (stageKey === 'confirmed') {
      if (trackingMeta.confirmedAt) return formatLagosDay(trackingMeta.confirmedAt)
      return stageIdx >= 2 ? 'Confirmed' : '—'
    }
    if (stageKey === 'sent_out') {
      if (trackingMeta.sentOutAt) return formatLagosDay(trackingMeta.sentOutAt)
      return stageIdx >= 3 ? 'Dispatched' : '—'
    }
    if (stageKey === 'delivered') {
      if (trackingMeta.deliveredAt) return formatLagosDay(trackingMeta.deliveredAt)
      if (stageIdx >= 4) return 'Delivered'
      if (trackingMeta.estimatedDelivery) return `Est. ${trackingMeta.estimatedDelivery}`
      return '—'
    }
    return idx <= stageIdx ? 'Done' : '—'
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">
            Order Delivery Status
          </span>
          {isTerminalOffTrack ? (
            <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
              <AlertCircle className="h-3 w-3" />
              {getStatusLabel(status)}
            </span>
          ) : null}
        </div>
        {trackingMeta.estimatedDelivery ? (
          <span className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
            <Truck className="h-3 w-3 text-amber-600" />
            Est. Delivery: {trackingMeta.estimatedDelivery}
          </span>
        ) : null}
      </div>

      {/* Horizontal 5-stage stepper */}
      <div className="overflow-x-auto pb-1">
        <ol className="grid min-w-[540px] grid-cols-5">
          {ORDER_TRACKING_STAGES.map((stage, idx) => {
            const isDelivered = stageIdx === 4
            const isCompleted =
              !isTerminalOffTrack &&
              (isDelivered ||
                (status === 'waiting_confirmation' ? idx < 1 : idx <= stageIdx))
            const isActive =
              !isTerminalOffTrack &&
              !isDelivered &&
              ((status === 'waiting_confirmation' && idx === 1) ||
                (status !== 'waiting_confirmation' && idx === stageIdx + 1))

            const leftLineFilled =
              !isTerminalOffTrack &&
              idx > 0 &&
              (isDelivered ||
                (status === 'waiting_confirmation' ? idx <= 1 : idx <= stageIdx))
            const rightLineFilled =
              !isTerminalOffTrack &&
              idx < ORDER_TRACKING_STAGES.length - 1 &&
              (isDelivered ||
                (status === 'waiting_confirmation' ? idx < 1 : idx < stageIdx))

            const dateLabel = getStageDateLabel(stage.key, idx)

            return (
              <li key={stage.key} className="relative flex flex-col items-center text-center">
                {/* Connector lines */}
                {idx > 0 ? (
                  <div
                    aria-hidden="true"
                    className={`absolute left-0 right-1/2 top-4 h-[2px] -translate-y-1/2 ${
                      leftLineFilled ? 'bg-amber-500' : 'bg-[#e2e2de]'
                    }`}
                  />
                ) : null}
                {idx < ORDER_TRACKING_STAGES.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className={`absolute left-1/2 right-0 top-4 h-[2px] -translate-y-1/2 ${
                      rightLineFilled ? 'bg-amber-500' : 'bg-[#e2e2de]'
                    }`}
                  />
                ) : null}

                {/* Step node circle */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : isActive
                        ? 'border-amber-500 bg-amber-50 text-amber-600 ring-4 ring-amber-500/15'
                        : 'border-[#d6d6d6] bg-white text-neutral-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Label & Date */}
                <span
                  className={`mt-2 px-1 text-[11px] font-semibold leading-tight ${
                    isCompleted || isActive ? 'text-[#030304]' : 'text-[#8a8a8a]'
                  }`}
                >
                  {stage.label}
                </span>
                <span
                  className={`mt-0.5 px-1 text-[10px] leading-tight ${
                    isActive
                      ? 'font-medium text-amber-700'
                      : isCompleted
                        ? 'text-[#6a6a6a]'
                        : 'text-[#a0a0a0]'
                  }`}
                >
                  {dateLabel}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
