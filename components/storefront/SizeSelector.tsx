'use client'

export interface StorefrontVariant {
  id: string
  size: string
  sku: string | null
  stockQty: number | null
}

interface SizeSelectorProps {
  variants: StorefrontVariant[]
  selectedId: string | null
  onSelect: (variantId: string) => void
  compact?: boolean
}

export function getStockLabel(stockQty: number | null): {
  text: string | null
  tone: 'out' | 'low' | 'ok'
} {
  if (stockQty === null) return { text: null, tone: 'ok' }
  if (stockQty <= 0) return { text: 'Out of stock', tone: 'out' }
  if (stockQty < 5) return { text: `Only ${stockQty} left`, tone: 'low' }
  return { text: null, tone: 'ok' }
}

export function SizeSelector({
  variants,
  selectedId,
  onSelect,
  compact = false,
}: SizeSelectorProps) {
  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null
  const stockInfo = selectedVariant ? getStockLabel(selectedVariant.stockQty) : null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {variants.map((variant) => {
          const outOfStock = variant.stockQty !== null && variant.stockQty <= 0
          const isSelected = variant.id === selectedId
          return (
            <button
              key={variant.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onSelect(variant.id)}
              className={[
                'rounded-md border transition-all duration-200 text-xs font-bold uppercase tracking-[0.08em] active:scale-95',
                compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5',
                outOfStock
                  ? 'border-white/10 bg-[#01121a]/60 text-slate-600 line-through cursor-not-allowed'
                  : isSelected
                    ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_12px_rgba(255,102,12,0.35)]'
                    : 'border-white/15 bg-[#01121a] text-slate-200 hover:border-[#ff660c] hover:text-[#ff660c]',
              ].join(' ')}
              title={
                outOfStock
                  ? 'Out of stock'
                  : variant.stockQty !== null && variant.stockQty < 5
                    ? `Only ${variant.stockQty} left`
                    : `Size ${variant.size}`
              }
            >
              {variant.size}
            </button>
          )
        })}
      </div>

      {stockInfo?.text ? (
        <p
          className={
            stockInfo.tone === 'out'
              ? 'text-xs font-semibold text-red-400'
              : 'text-xs font-semibold text-[#ff660c]'
          }
        >
          {stockInfo.text}
        </p>
      ) : null}
    </div>
  )
}
