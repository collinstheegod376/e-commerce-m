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
    <article className="flex flex-col bg-white p-6 transition-colors hover:bg-[#fafaf8]">
      <div className="flex items-center justify-between text-xs text-[#6a6a6a]">
        <span className="uppercase tracking-[0.06em]">
          {meta.modelUrl ? '3D Interactive' : 'Archive Piece'}
        </span>
        <span className="font-bold">{String(index + 1).padStart(2, '0')}</span>
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

      <div className="mb-4 flex-1">
        <span className="result-meta">{meta.eyebrow}</span>
        <Link href={`/products/${product.slug}`} className="mt-1 block hover:underline">
          <h3 className="text-xl font-bold tracking-[-0.04em] text-[#030304]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-semibold text-[#030304]">
          {formatNairaCompact(product.priceKobo)}
        </p>
      </div>

      <div className="space-y-3 border-t border-[#ecece8] pt-4">
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
