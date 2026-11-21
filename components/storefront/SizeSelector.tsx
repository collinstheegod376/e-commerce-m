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
                'border transition-colors text-xs font-medium',
                compact ? 'px-2.5 py-1' : 'px-3.5 py-2',
                outOfStock
                  ? 'border-[#e5e5e5] bg-[#f7f7f5] text-[#a3a3a3] line-through cursor-not-allowed'
                  : isSelected
                    ? 'border-[#030304] bg-[#030304] text-white'
                    : 'border-[#d6d6d6] bg-white text-[#030304] hover:border-[#030304]',
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
              ? 'text-xs font-medium text-[#b91c1c]'
              : 'text-xs font-medium text-[#ff5331]'
          }
        >
          {stockInfo.text}
        </p>
      ) : null}
    </div>
  )
}
