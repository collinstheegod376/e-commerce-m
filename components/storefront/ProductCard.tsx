'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatNairaCompact } from '@/lib/money'
import { getProductEditorialMeta } from '@/lib/models-3d'
import { SizeSelector, type StorefrontVariant } from '@/components/storefront/SizeSelector'
import { AddToCart } from '@/components/storefront/AddToCart'

export interface StorefrontProduct {
  id: string
  slug: string
  name: string
  description: string | null
  priceKobo: number
  images: string[]
  variants: StorefrontVariant[]
}

interface ProductCardProps {
  product: StorefrontProduct
  index: number
}

export function ProductCard({ product, index }: ProductCardProps) {
  const firstAvailable =
    product.variants.find((v) => v.stockQty === null || v.stockQty > 0) ??
    product.variants[0] ??
    null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailable?.id ?? null,
  )

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null
  const outOfStock =
    !selectedVariant || (selectedVariant.stockQty !== null && selectedVariant.stockQty <= 0)
  const meta = getProductEditorialMeta(product.slug, index)
  const heroImg = product.images[0] ?? null

  return (
    <article className="group flex flex-col rounded-2xl border border-white/12 bg-[#041b26]/90 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#ff660c]/60 hover:bg-[#072330] hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full border border-[#ff660c]/35 bg-[#ff660c]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff660c]">
          Archive Piece
        </span>
        <span className="font-brush text-base text-slate-400 group-hover:text-[#ff660c]">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="product-mark hoodie-mark my-4 block overflow-hidden"
      >
        {heroImg ? (
          <img src={heroImg} alt={product.name} />
        ) : (
          <span>{product.name.slice(0, 2).toUpperCase()}</span>
        )}
      </Link>

      <div className="mb-5 flex-1">
        <span className="result-meta">{meta.eyebrow}</span>
        <Link
          href={`/products/${product.slug}`}
          className="mt-1.5 block transition-colors group-hover:text-[#ff660c]"
        >
          <h3 className="font-brush text-2xl uppercase tracking-[0.02em] text-[#f8fafc] transition-colors group-hover:text-[#ff660c]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-base font-extrabold text-[#ff660c]">
          {formatNairaCompact(product.priceKobo)}
        </p>
      </div>

      <div className="space-y-3.5 border-t border-white/10 pt-4">
        <SizeSelector
          variants={product.variants}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
          compact
        />
        <AddToCart
          variantId={selectedVariantId}
          qty={1}
          disabled={outOfStock}
          label={outOfStock ? 'Out of stock' : 'Add to cart'}
        />
      </div>
    </article>
  )
}
