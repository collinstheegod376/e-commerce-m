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
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Media / 3D Viewer */}
      <div className="lg:col-span-7">
        <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#072330] to-[#041b26] p-6 shadow-2xl">
          {show3D && meta.modelUrl ? (
            <ModelViewer
              src={meta.modelUrl}
              poster={product.images[0]}
              alt={product.name}
              className="hero-3d relative !h-[500px] !w-full"
            />
          ) : (
            <div className="flex h-[480px] w-full items-center justify-center rounded-xl bg-slate-100 p-6">
              <img
                src={product.images[activeImageIdx] ?? '/assets/57c8a.png'}
                alt={product.name}
                className="max-h-full w-full object-contain mix-blend-multiply"
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {meta.modelUrl ? (
            <button
              type="button"
              onClick={() => setShow3D(true)}
              className={`rounded-lg border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                show3D
                  ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_16px_rgba(255,102,12,0.35)]'
                  : 'border-white/15 bg-[#041b26] text-slate-200 hover:border-[#ff660c] hover:text-[#ff660c]'
              }`}
            >
              3D Studio View
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
              className={`h-16 w-16 overflow-hidden rounded-lg border bg-slate-100 p-1.5 transition-all ${
                !show3D && activeImageIdx === idx
                  ? 'border-2 border-[#ff660c] ring-2 ring-[#ff660c]/30'
                  : 'border-white/15 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={imgUrl}
                alt=""
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Info & Controls */}
      <div className="flex flex-col lg:col-span-5">
        <p className="page-kicker">{meta.eyebrow}</p>
        <h1 className="mt-3 font-brush text-[clamp(2.5rem,5vw,4.3rem)] uppercase leading-[1.02] tracking-[0.02em] text-[#f8fafc]">
          {product.name}
        </h1>
        <p className="mt-4 text-2xl font-extrabold tracking-tight text-[#ff660c]">
          {formatNairaCompact(product.priceKobo)}
        </p>

        {product.description ? (
          <p className="mt-6 text-sm leading-[1.85] text-slate-300 sm:text-base">
            {product.description}
          </p>
        ) : null}

        <div className="mt-8 space-y-6 rounded-2xl border border-white/12 bg-[#041b26]/90 p-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Select Size
            </p>
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
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Quantity
            </p>
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

          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
            <Link className=" transition-colors hover:text-[#ff660c]" href="/cart">
              View Cart →
            </Link>
            <Link className="transition-colors hover:text-[#ff660c]" href="/">
              ← Back to Collection
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {meta.features.map((feat, idx) => (
            <div
              key={feat}
              className="rounded-xl border border-white/10 bg-[#041b26]/70 p-3.5 text-xs font-semibold text-slate-200"
            >
              <span className="mr-2 text-[10px] font-bold text-[#ff660c]">0{idx + 1}</span>
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
