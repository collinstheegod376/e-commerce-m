import { AlertCircle, Check, Clock, PackageCheck } from 'lucide-react'
import {
  ORDER_TRACKING_STAGES,
  type OrderTrackingStageKey,
  type OrderTrackingTimestamps,
  getStageIndex,
  getStatusLabel,
} from '@/lib/order-status'

export interface OrderTrackingStepperProps {
  status: string
  timestamps?: OrderTrackingTimestamps | null
  theme?: 'dark' | 'light'
  showHeader?: boolean
  compact?: boolean
  className?: string
}

function formatStageTimestamp(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function getStageTimestamp(
  key: OrderTrackingStageKey,
  timestamps?: OrderTrackingTimestamps | null,
): string | null {
  if (!timestamps) return null
  switch (key) {
    case 'paid':
      return formatStageTimestamp(timestamps.paidAt)
    case 'waiting_confirmation':
      return formatStageTimestamp(timestamps.waitingConfirmationAt)
    case 'confirmed':
      return formatStageTimestamp(timestamps.confirmedAt)
    case 'sent_out':
      return formatStageTimestamp(timestamps.sentOutAt)
    case 'delivered':
      return formatStageTimestamp(timestamps.deliveredAt)
    default:
      return null
  }
}

function getNextStepGuidance(status: string, estimatedDelivery?: string | null): string {
  switch (status) {
    case 'pending':
      return 'Awaiting payment verification from Paystack. Once confirmed, your order enters our Lagos studio review queue automatically.'
    case 'paid':
    case 'waiting_confirmation':
      return 'Next step: Our Lagos studio team will review and confirm your order. This tracker updates automatically as your pieces move forward.'
    case 'confirmed':
      return 'Next step: Your order is confirmed and being prepared for dispatch. You will see it move to Sent Out once handed to our courier.'
    case 'sent_out':
      return estimatedDelivery
        ? `Next step: Your package is on the way with our courier. Expected delivery: ${estimatedDelivery}.`
        : 'Next step: Your package is on the way with our courier and will be marked Delivered upon arrival.'
    case 'delivered':
    case 'fulfilled':
      return 'Your order has been delivered. Thank you for wearing Maison Kriss.'
    case 'failed':
      return 'Payment was not completed for this order. You can return to your cart to try again.'
    case 'cancelled':
      return 'This order has been cancelled. Reach out to our Lagos studio desk if you have any questions.'
    case 'refunded':
      return 'This order has been refunded. Please allow standard bank processing time for funds to reflect.'
    case 'abandoned':
      return 'Checkout was not completed for this order.'
    default:
      return 'Status updates are posted here automatically as our studio processes your order.'
  }
}

type StageVisualState = 'completed' | 'current' | 'upcoming'

function resolveStageStates(status: string): {
  states: StageVisualState[]
  progressRatio: number
  isException: boolean
} {
  const stageCount = ORDER_TRACKING_STAGES.length
  const stageIndex = getStageIndex(status)

  if (stageIndex === -1) {
    if (status === 'pending') {
      return {
        states: ORDER_TRACKING_STAGES.map((_, idx) => (idx === 0 ? 'current' : 'upcoming')),
        progressRatio: 0,
        isException: false,
      }
    }
    return {
      states: ORDER_TRACKING_STAGES.map(() => 'upcoming'),
      progressRatio: 0,
      isException: true,
    }
  }

  // Delivered / fulfilled -> all 5 milestones completed
  if (stageIndex === stageCount - 1) {
    return {
      states: ORDER_TRACKING_STAGES.map(() => 'completed'),
      progressRatio: 1,
      isException: false,
    }
  }

  // Paid -> Paid is completed, Waiting for Confirmation is actively in progress
  if (stageIndex === 0) {
    return {
      states: ORDER_TRACKING_STAGES.map((_, idx) => {
        if (idx === 0) return 'completed'
        if (idx === 1) return 'current'
        return 'upcoming'
      }),
      progressRatio: 1 / (stageCount - 1),
      isException: false,
    }
  }

  // Intermediate stages (waiting_confirmation, confirmed, sent_out):
  // Prior stages completed, current stage highlighted with Clock icon
  return {
    states: ORDER_TRACKING_STAGES.map((_, idx) => {
      if (idx < stageIndex) return 'completed'
      if (idx === stageIndex) return 'current'
      return 'upcoming'
    }),
    progressRatio: stageIndex / (stageCount - 1),
    isException: false,
  }
}

export function OrderTrackingStepper({
  status,
  timestamps,
  theme = 'dark',
  showHeader = true,
  compact = false,
  className = '',
}: OrderTrackingStepperProps) {
  const isDark = theme === 'dark'
  const { states, progressRatio, isException } = resolveStageStates(status)
  const statusLabel = getStatusLabel(status)
  const guidance = getNextStepGuidance(status, timestamps?.estimatedDelivery)
  const isDelivered = status === 'delivered' || status === 'fulfilled'

  const containerClasses = isDark
    ? 'rounded-xl border border-white/12 bg-[#041b26]/90 text-[#f8fafc]'
    : 'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm'

  const paddingClasses = compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'

  const trackBgClass = isDark ? 'bg-white/15' : 'bg-slate-200'
  const headingClass = isDark ? 'text-[#f8fafc]' : 'text-slate-900'
  const subtitleClass = isDark ? 'text-[#94a3b8]' : 'text-slate-500'

  const badgeClasses = isException
    ? isDark
      ? 'border-red-500/40 bg-red-500/15 text-red-300'
      : 'border-red-200 bg-red-50 text-red-700'
    : isDelivered
      ? isDark
        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : isDark
        ? 'border-[#ff660c]/40 bg-[#ff660c]/15 text-[#ff8a47]'
        : 'border-orange-200 bg-orange-50 text-[#d94f04]'

  return (
    <div className={`w-full min-w-0 max-w-full overflow-hidden ${containerClasses} ${paddingClasses} ${className}`}>
      {showHeader ? (
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className={`break-words font-display text-base font-bold tracking-tight sm:text-lg ${headingClass}`}
            >
              Order Delivery Status
            </h3>
            <p className={`mt-1 break-words text-xs leading-relaxed sm:text-sm ${subtitleClass}`}>
              Here you can check the status of your delivery with the estimated delivery time.
            </p>
          </div>
          <span
            className={`inline-flex max-w-full shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${badgeClasses}`}
          >
            {isException ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : isDelivered ? (
              <PackageCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
            )}
            <span className="break-words">{statusLabel}</span>
          </span>
        </div>
      ) : null}

      {/* Desktop Horizontal Stepper (md and up) */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background Connector Line */}
          <div
            aria-hidden="true"
            className={`absolute left-[10%] right-[10%] top-5 h-[2px] ${trackBgClass}`}
          />
          {/* Active Orange Progress Line */}
          <div
            aria-hidden="true"
            className="absolute left-[10%] top-5 h-[2px] bg-[#ff660c] transition-all duration-500 ease-out"
            style={{ width: `${Math.round(progressRatio * 80)}%` }}
          />

          <ol className="relative grid grid-cols-5 gap-2">
            {ORDER_TRACKING_STAGES.map((stage, idx) => {
              const state = states[idx]
              const formattedTime = getStageTimestamp(stage.key, timestamps)
              const isFinalStage = stage.key === 'delivered'
              const expectedText =
                isFinalStage && state !== 'completed' && timestamps?.estimatedDelivery
                  ? `Expected ${timestamps.estimatedDelivery}`
                  : null

              const nodeClasses =
                state === 'completed'
                  ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_16px_rgba(255,102,12,0.35)]'
                  : state === 'current'
                    ? isDark
                      ? 'border-[#ff660c] bg-[#01121a] text-[#ff660c] ring-4 ring-[#ff660c]/20 animate-mk-glow'
                      : 'border-[#ff660c] bg-orange-50 text-[#ff660c] ring-4 ring-[#ff660c]/20'
                    : isDark
                      ? 'border-white/20 bg-[#01121a] text-slate-500'
                      : 'border-slate-300 bg-white text-slate-400'

              const labelClasses =
                state === 'completed'
                  ? isDark
                    ? 'text-[#f8fafc] font-semibold'
                    : 'text-slate-900 font-semibold'
                  : state === 'current'
                    ? 'text-[#ff660c] font-bold'
                    : isDark
                      ? 'text-slate-400 font-medium'
                      : 'text-slate-400 font-medium'

              const subtextClasses =
                state === 'current'
                  ? isDark
                    ? 'text-slate-300'
                    : 'text-slate-600'
                  : isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'

              return (
                <li
                  key={stage.key}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${nodeClasses}`}
                  >
                    {state === 'completed' ? (
                      <Check className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
                    ) : state === 'current' ? (
                      <Clock className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current opacity-60" aria-hidden="true" />
                    )}
                  </div>

                  <p className={`mt-3 text-xs leading-snug ${labelClasses}`}>{stage.label}</p>

                  {formattedTime ? (
                    <p className={`mt-1 text-[11px] leading-tight ${subtextClasses}`}>
                      {formattedTime}
                    </p>
                  ) : expectedText ? (
                    <p className="mt-1 text-[11px] font-medium leading-tight text-[#ff660c]">
                      {expectedText}
                    </p>
                  ) : state === 'current' ? (
                    <p className={`mt-1 text-[11px] leading-tight ${subtextClasses}`}>
                      {status === 'pending' ? 'Awaiting payment' : 'In progress'}
                    </p>
                  ) : (
                    <p
                      className={`mt-1 text-[11px] leading-tight ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {state === 'completed' ? 'Completed' : 'Upcoming'}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* Mobile Vertical Stepper (below md) */}
      <ol className="flex min-w-0 flex-col md:hidden">
        {ORDER_TRACKING_STAGES.map((stage, idx) => {
          const state = states[idx]
          const isLast = idx === ORDER_TRACKING_STAGES.length - 1
          const formattedTime = getStageTimestamp(stage.key, timestamps)
          const isFinalStage = stage.key === 'delivered'
          const expectedText =
            isFinalStage && state !== 'completed' && timestamps?.estimatedDelivery
              ? `Expected ${timestamps.estimatedDelivery}`
              : null

          const nextState = states[idx + 1]
          const connectorFilled =
            state === 'completed' && (nextState === 'completed' || nextState === 'current')

          const nodeClasses =
            state === 'completed'
              ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_12px_rgba(255,102,12,0.35)]'
              : state === 'current'
                ? isDark
                  ? 'border-[#ff660c] bg-[#01121a] text-[#ff660c] ring-4 ring-[#ff660c]/20 animate-mk-glow'
                  : 'border-[#ff660c] bg-orange-50 text-[#ff660c] ring-4 ring-[#ff660c]/20'
                : isDark
                  ? 'border-white/20 bg-[#01121a] text-slate-500'
                  : 'border-slate-300 bg-white text-slate-400'

          const labelClasses =
            state === 'completed'
              ? isDark
                ? 'text-[#f8fafc] font-semibold'
                : 'text-slate-900 font-semibold'
              : state === 'current'
                ? 'text-[#ff660c] font-bold'
                : isDark
                  ? 'text-slate-400 font-medium'
                  : 'text-slate-400 font-medium'

          return (
            <li
              key={stage.key}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex min-w-0 gap-3"
            >
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${nodeClasses}`}
                >
                  {state === 'completed' ? (
                    <Check className="h-4 w-4 stroke-[2.75]" aria-hidden="true" />
                  ) : state === 'current' ? (
                    <Clock className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-current opacity-60" aria-hidden="true" />
                  )}
                </div>
                {!isLast ? (
                  <div
                    aria-hidden="true"
                    className={`my-1 w-[2px] flex-1 min-h-[24px] ${
                      connectorFilled ? 'bg-[#ff660c]' : trackBgClass
                    }`}
                  />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 pt-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                <p className={`break-words text-sm leading-tight ${labelClasses}`}>{stage.label}</p>
                <p
                  className={`mt-0.5 break-words text-xs leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {stage.description}
                </p>
                {formattedTime ? (
                  <p
                    className={`mt-1 break-words text-[11px] font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {formattedTime}
                  </p>
                ) : expectedText ? (
                  <p className="mt-1 break-words text-[11px] font-semibold text-[#ff660c]">
                    {expectedText}
                  </p>
                ) : state === 'current' ? (
                  <p className="mt-1 break-words text-[11px] font-medium text-[#ff660c]">
                    {status === 'pending' ? 'Awaiting payment' : 'In progress'}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Helper Guidance Footer */}
      <div
        className={`mt-5 flex min-w-0 flex-col gap-2 border-t pt-4 text-xs leading-relaxed sm:mt-6 sm:flex-row sm:items-center sm:justify-between ${
          isDark
            ? 'border-white/10 text-slate-300'
            : 'border-slate-200/80 text-slate-600'
        }`}
      >
        <p className="min-w-0 break-words">{guidance}</p>
        {isDark ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Live Studio Tracker
          </span>
        ) : null}
      </div>
    </div>
  )
}
