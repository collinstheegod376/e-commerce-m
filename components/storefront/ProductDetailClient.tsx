'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatNairaCompact } from '@/lib/money'
import { getProductEditorialMeta } from '@/lib/models-3d'
import { ModelViewer } from '@/components/storefront/ModelViewer'
import { SizeSelector } from '@/components/storefront/SizeSelector'
import { QtyStepper } from '@/components/storefront/QtyStepper'
import { AddToCart } from '@/components/storefront/AddToCart'
import type { StorefrontProduct } from '@/components/storefront/ProductCard'

interface ProductDetailClientProps {
  product: StorefrontProduct
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const firstAvailable =
    product.variants.find((v) => v.stockQty === null || v.stockQty > 0) ??
    product.variants[0] ??
    null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailable?.id ?? null,
  )
  const [qty, setQty] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null
  const outOfStock =
    !selectedVariant || (selectedVariant.stockQty !== null && selectedVariant.stockQty <= 0)
  const meta = getProductEditorialMeta(product.slug)
  const [show3D, setShow3D] = useState(Boolean(meta.modelUrl))

  const maxQty = selectedVariant?.stockQty ?? null

  return (
    <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
      {/* Media / 3D Viewer */}
      <div className="lg:col-span-7">
        <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden border border-[#d6d6d6] bg-[#edf0ed]">
          {show3D && meta.modelUrl ? (
            <ModelViewer
              src={meta.modelUrl}
              poster={product.images[0]}
              alt={product.name}
              className="hero-image hero-3d !static !h-[520px] !w-full"
            />
          ) : (
            <img
              src={product.images[activeImageIdx] ?? '/assets/57c8a.png'}
              alt={product.name}
              className="max-h-[520px] w-full object-contain p-8 mix-blend-darken"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {meta.modelUrl ? (
            <button
              type="button"
              onClick={() => setShow3D(true)}
              className={`border px-3.5 py-2 text-xs uppercase tracking-[0.06em] ${
                show3D
                  ? 'border-[#030304] bg-[#030304] text-white'
                  : 'border-[#d6d6d6] bg-white text-[#030304]'
              }`}
            >
              3D Model
            </button>
          ) : null}

          {product.images.map((imgUrl, idx) => (
            <button
              key={imgUrl}
              type="button"
              onClick={() => {
                setShow3D(false)
                setActiveImageIdx(idx)
              }}
              className={`h-16 w-16 overflow-hidden border bg-[#edf0ed] p-1 ${
                !show3D && activeImageIdx === idx
                  ? 'border-[#030304]'
                  : 'border-[#d6d6d6] opacity-75 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="" className="h-full w-full object-contain mix-blend-darken" />
            </button>
          ))}
        </div>
      </div>

      {/* Info & Controls */}
      <div className="flex flex-col lg:col-span-5">
        <p className="page-kicker">{meta.eyebrow}</p>
        <h1 className="mt-2 text-[clamp(2.5rem,5vw,4.2rem)] font-bold leading-[0.95] tracking-[-0.06em] text-[#030304]">
          {product.name}
        </h1>
        <p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#030304]">
          {formatNairaCompact(product.priceKobo)}
        </p>

        {product.description ? (
          <p className="mt-6 text-sm leading-[1.8] text-[#5a5a5a]">{product.description}</p>
        ) : null}

        <div className="mt-8 space-y-6 border-t border-[#d6d6d6] pt-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.08em] text-[#6a6a6a]">Select Size</p>
            <SizeSelector
              variants={product.variants}
              selectedId={selectedVariantId}
              onSelect={(id) => {
                setSelectedVariantId(id)
                setQty(1)
              }}
            />
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.08em] text-[#6a6a6a]">Quantity</p>
            <QtyStepper
              value={qty}
              min={1}
              max={maxQty}
              disabled={outOfStock}
              onChange={setQty}
              itemLabel={product.name}
            />
          </div>

          <div className="pt-2">
            <AddToCart
              variantId={selectedVariantId}
              qty={qty}
              disabled={outOfStock}
              label={outOfStock ? 'Out of stock' : 'Add To Cart'}
              priceLabel={formatNairaCompact(product.priceKobo * qty)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-[#6a6a6a]">
            <Link className="underline underline-offset-4 hover:text-[#030304]" href="/cart">
              View Cart →
            </Link>
            <Link className="underline underline-offset-4 hover:text-[#030304]" href="/">
              ← Back to Collection
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-px bg-[#d6d6d6] border border-[#d6d6d6]">
          {meta.features.map((feat) => (
            <div key={feat} className="bg-white p-3.5 text-xs font-semibold text-[#3a3a3a]">
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
