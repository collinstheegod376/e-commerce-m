'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
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

      <div className="cart-info min-w-0">
        <p>{String(index + 1).padStart(2, '0')} / Maison Kriss</p>
        <Link href={`/products/${item.product.slug}`} className="hover:underline">
          <h2 className="break-words !text-lg leading-snug sm:!text-[1.45rem]">
            {item.product.name}
          </h2>
        </Link>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>Size {item.size}</span>
          <span aria-hidden="true">·</span>
          <span>{formatNairaCompact(item.unitPriceKobo)} each</span>
          {item.stockQty !== null && item.stockQty < 5 ? (
            <span className="!text-[#ff5331]">Only {item.stockQty} left</span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item.id)}
          aria-busy={busy}
          className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-[#757575] underline underline-offset-4 hover:text-[#ff5331] active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin text-[#ff5331]" aria-hidden="true" /> : null}
          <span>{busy ? 'Updating…' : 'Remove'}</span>
        </button>
      </div>

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1 sm:contents">
        <QtyStepper
          value={item.qty}
          min={0}
          max={item.stockQty}
          disabled={busy}
          itemLabel={`${item.product.name} (${item.size})`}
          onChange={(next) => onUpdateQty(item.id, next)}
        />

        <strong className="whitespace-nowrap font-sans text-base font-bold text-[#ff660c] sm:text-right sm:text-[0.95rem]">
          {formatNairaCompact(lineTotalKobo)}
        </strong>
      </div>
    </article>
  )
}
