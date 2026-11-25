'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
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
  const images =
    product.images.length > 0 ? product.images : ['/assets/57c8a.png']

  const firstAvailable =
    product.variants.find((v) => v.stockQty === null || v.stockQty > 0) ??
    product.variants[0] ??
    null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailable?.id ?? null,
  )
  const [qty, setQty] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [show3D, setShow3D] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxZoomed, setLightboxZoomed] = useState(false)

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null
  const outOfStock =
    !selectedVariant || (selectedVariant.stockQty !== null && selectedVariant.stockQty <= 0)
  const meta = getProductEditorialMeta(product.slug)
  const maxQty = selectedVariant?.stockQty ?? null

  const safeImageIdx = Math.min(activeImageIdx, images.length - 1)
  const currentImage = images[safeImageIdx]
  const currentLabel =
    safeImageIdx === 0 ? 'Main View' : `Inspect ${safeImageIdx}`

  const handlePrevImage = useCallback(() => {
    setShow3D(false)
    setLightboxZoomed(false)
    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const handleNextImage = useCallback(() => {
    setShow3D(false)
    setLightboxZoomed(false)
    setActiveImageIdx((prev) => (prev + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightboxOpen(false)
        setLightboxZoomed(false)
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, handlePrevImage, handleNextImage])

  function openLightbox(index?: number) {
    if (typeof index === 'number') {
      setActiveImageIdx(index)
    }
    setShow3D(false)
    setLightboxZoomed(false)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Media / Inspect Piece Gallery */}
        <div className="lg:col-span-7">
          <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#072330] to-[#041b26] p-4 sm:p-6 shadow-2xl">
            {show3D && meta.modelUrl ? (
              <ModelViewer
                src={meta.modelUrl}
                poster={images[0]}
                alt={product.name}
                className="hero-3d relative !h-[500px] !w-full"
              />
            ) : (
              <div className="group relative flex h-[480px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-6">
                {/* Main / Active Angle Image */}
                <button
                  type="button"
                  onClick={() => openLightbox()}
                  aria-label={`Inspect ${product.name} (${currentLabel}) in full screen`}
                  className="flex h-full w-full cursor-zoom-in items-center justify-center"
                >
                  <img
                    src={currentImage}
                    alt={`${product.name} — ${currentLabel}`}
                    className="max-h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>

                {/* Top-Left Angle Pill */}
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/15 bg-[#01121a]/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-100 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" />
                  <span>{currentLabel}</span>
                  <span className="text-slate-400">
                    {safeImageIdx + 1} / {images.length}
                  </span>
                </div>

                {/* Top-Right Inspect Piece / Fullscreen Trigger */}
                <button
                  type="button"
                  onClick={() => openLightbox()}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#ff660c]/60 bg-[#01121a]/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f8fafc] backdrop-blur-sm transition-all hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                >
                  <Expand className="h-3.5 w-3.5" />
                  Inspect Piece
                </button>

                {/* Prev / Next Arrows */}
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous angle"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#01121a]/80 text-white backdrop-blur-sm transition-all hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next angle"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#01121a]/80 text-white backdrop-blur-sm transition-all hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Interactive Multi-Angle Thumbnail Strip */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>
                Inspection Angles ({images.length})
              </span>
              {images.length > 1 ? (
                <button
                  type="button"
                  onClick={() => openLightbox()}
                  className="text-[#ff660c] transition-colors hover:text-[#ff853d]"
                >
                  Open Full Gallery →
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {images.map((imgUrl, idx) => {
                const isActive = !show3D && safeImageIdx === idx
                const thumbLabel = idx === 0 ? 'Main' : `Inspect ${idx}`
                return (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => {
                      setShow3D(false)
                      setActiveImageIdx(idx)
                    }}
                    className={`group relative flex flex-col items-center overflow-hidden rounded-xl border bg-[#041b26] p-1 transition-all ${
                      isActive
                        ? 'border-2 border-[#ff660c] ring-2 ring-[#ff660c]/30'
                        : 'border-white/15 opacity-80 hover:border-white/40 hover:opacity-100'
                    }`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-1">
                      <img
                        src={imgUrl}
                        alt={`${product.name} ${thumbLabel}`}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <span
                      className={`mt-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
                        isActive ? 'text-[#ff660c]' : 'text-slate-300'
                      }`}
                    >
                      {thumbLabel}
                    </span>
                  </button>
                )
              })}

              {meta.modelUrl ? (
                <button
                  type="button"
                  onClick={() => setShow3D(true)}
                  className={`flex h-[88px] items-center justify-center rounded-xl border px-4 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                    show3D
                      ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_16px_rgba(255,102,12,0.35)]'
                      : 'border-white/15 bg-[#041b26] text-slate-200 hover:border-[#ff660c] hover:text-[#ff660c]'
                  }`}
                >
                  3D Studio View
                </button>
              ) : null}
            </div>
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
              <Link className="transition-colors hover:text-[#ff660c]" href="/cart">
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

      {/* Lightbox Inspection Modal */}
      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Inspect ${product.name}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#01121a]/95 backdrop-blur-md"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#ff660c] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#01121a]">
                {currentLabel}
              </span>
              <span className="text-xs font-semibold text-slate-200 sm:text-sm">
                {product.name}
              </span>
              <span className="text-xs text-slate-400">
                {safeImageIdx + 1} / {images.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoomed((z) => !z)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#041b26] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
              >
                {lightboxZoomed ? (
                  <>
                    <ZoomOut className="h-4 w-4" />
                    Reset Zoom
                  </>
                ) : (
                  <>
                    <ZoomIn className="h-4 w-4" />
                    Zoom In
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false)
                  setLightboxZoomed(false)
                }}
                aria-label="Close inspection gallery"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#041b26] text-slate-200 transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Main Image Stage */}
          <div className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
            <div
              onClick={() => setLightboxZoomed((z) => !z)}
              className={`relative flex max-h-[72vh] max-w-4xl items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-slate-100 p-4 sm:p-6 ${
                lightboxZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={currentImage}
                alt={`${product.name} — ${currentLabel}`}
                className={`max-h-[65vh] w-auto object-contain mix-blend-multiply transition-transform duration-300 ${
                  lightboxZoomed ? 'scale-150 sm:scale-[1.75]' : 'scale-100'
                }`}
              />
            </div>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous angle"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#041b26]/90 text-white transition-all hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next angle"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#041b26]/90 text-white transition-all hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>

          {/* Modal Thumbnail Strip */}
          {images.length > 1 ? (
            <div className="border-t border-white/10 bg-[#041b26]/80 px-4 py-3">
              <div className="mx-auto flex max-w-4xl items-center justify-center gap-2.5 overflow-x-auto">
                {images.map((imgUrl, idx) => {
                  const isActive = safeImageIdx === idx
                  const thumbLabel = idx === 0 ? 'Main' : `Inspect ${idx}`
                  return (
                    <button
                      key={`modal-${imgUrl}-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveImageIdx(idx)
                        setLightboxZoomed(false)
                      }}
                      className={`flex shrink-0 flex-col items-center rounded-lg border bg-[#01121a] p-1 transition-all ${
                        isActive
                          ? 'border-2 border-[#ff660c] ring-2 ring-[#ff660c]/30'
                          : 'border-white/15 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-slate-100 p-1">
                        <img
                          src={imgUrl}
                          alt={`${product.name} ${thumbLabel}`}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <span
                        className={`mt-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
                          isActive ? 'text-[#ff660c]' : 'text-slate-300'
                        }`}
                      >
                        {thumbLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
