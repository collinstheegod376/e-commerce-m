'use client'

import Link from 'next/link'
import type { CartLineItem } from '@/lib/cart'
import { formatNairaCompact } from '@/lib/money'
import { QtyStepper } from '@/components/storefront/QtyStepper'

interface CartLineProps {
  item: CartLineItem
  index: number
  busy: boolean
  onUpdateQty: (itemId: string, nextQty: number) => void
  onRemove: (itemId: string) => void
}

export function CartLine({
  item,
  index,
  busy,
  onUpdateQty,
  onRemove,
}: CartLineProps) {
  const lineTotalKobo = item.unitPriceKobo * item.qty

  return (
    <article className="cart-row">
      <Link
        href={`/products/${item.product.slug}`}
        className="product-mark hoodie-mark block"
      >
        {item.product.image ? (
          <img src={item.product.image} alt={item.product.name} />
        ) : (
          <span>{item.product.name.slice(0, 2).toUpperCase()}</span>
        )}
      </Link>

      <div className="cart-info">
        <p>{String(index + 1).padStart(2, '0')} / Maison Kriss</p>
        <Link href={`/products/${item.product.slug}`} className="hover:underline">
          <h2>{item.product.name}</h2>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span>Size {item.size}</span>
          <span>·</span>
          <span>{formatNairaCompact(item.unitPriceKobo)} each</span>
          {item.stockQty !== null && item.stockQty < 5 ? (
            <span className="!text-[#ff5331]">Only {item.stockQty} left</span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item.id)}
          className="mt-3 text-[11px] uppercase tracking-[0.06em] text-[#757575] underline underline-offset-4 hover:text-[#ff5331] disabled:opacity-40"
        >
          Remove
        </button>
      </div>

      <QtyStepper
        value={item.qty}
        min={0}
        max={item.stockQty}
        disabled={busy}
        itemLabel={`${item.product.name} (${item.size})`}
        onChange={(next) => onUpdateQty(item.id, next)}
      />

      <strong className="whitespace-nowrap">{formatNairaCompact(lineTotalKobo)}</strong>
    </article>
  )
}
