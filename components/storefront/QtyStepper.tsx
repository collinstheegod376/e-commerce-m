'use client'

interface QtyStepperProps {
  value: number
  min?: number
  max?: number | null
  disabled?: boolean
  onChange: (next: number) => void
  itemLabel?: string
}

export function QtyStepper({
  value,
  min = 1,
  max = null,
  disabled = false,
  onChange,
  itemLabel = 'item',
}: QtyStepperProps) {
  const canDecrease = !disabled && value > min
  const canIncrease = !disabled && (max === null || value < max)

  return (
    <div className="quantity-stepper inline-flex bg-white">
      <button
        type="button"
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease quantity of ${itemLabel}`}
        className="disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f5f5f2]"
      >
        −
      </button>
      <span aria-live="polite">{String(value).padStart(2, '0')}</span>
      <button
        type="button"
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${itemLabel}`}
        className="disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#f5f5f2]"
      >
        +
      </button>
    </div>
  )
}
