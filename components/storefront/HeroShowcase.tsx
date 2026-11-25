'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Eye,
  Search,
  X,
} from 'lucide-react'
import { formatNairaCompact } from '@/lib/money'
import { getProductEditorialMeta } from '@/lib/models-3d'
import { ModelViewer } from '@/components/storefront/ModelViewer'
import { AddToCart } from '@/components/storefront/AddToCart'
import { ProductCard, type StorefrontProduct } from '@/components/storefront/ProductCard'
import { getStockLabel } from '@/components/storefront/SizeSelector'

interface HeroShowcaseProps {
  products: StorefrontProduct[]
}

export function HeroShowcase({ products }: HeroShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<
    Record<string, string>
  >({})
  const [qty, setQty] = useState(1)
  const [search, setSearch] = useState('')

  const activeProduct = products[activeIndex] ?? products[0] ?? null
  const activeMeta = activeProduct
    ? getProductEditorialMeta(activeProduct.slug, activeIndex)
    : null

  const activeVariantId = useMemo(() => {
    if (!activeProduct) return null
    const chosen = selectedVariantByProduct[activeProduct.id]
    if (chosen && activeProduct.variants.some((v) => v.id === chosen)) {
      return chosen
    }
    const firstAvail =
      activeProduct.variants.find((v) => v.stockQty === null || v.stockQty > 0) ??
      activeProduct.variants[0]
    return firstAvail?.id ?? null
  }, [activeProduct, selectedVariantByProduct])

  const activeVariant =
    activeProduct?.variants.find((v) => v.id === activeVariantId) ?? null
  const activeOutOfStock =
    !activeVariant || (activeVariant.stockQty !== null && activeVariant.stockQty <= 0)
  const activeStockInfo = activeVariant ? getStockLabel(activeVariant.stockQty) : null

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.variants.some((v) => v.size.toLowerCase().includes(q)),
    )
  }, [products, search])

  return (
    <>
      {activeProduct && activeMeta ? (
        <section
          className="storefront relative overflow-hidden border-b border-white/10"
          aria-label="Featured drop showcase"
        >
          {/* Ambient radial glow & guide lines */}
          <img className="guide-lines" src="/assets/b6522.svg" alt="" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 right-1/4 h-96 w-96 rounded-full bg-[#ff660c]/12 blur-[130px]"
          />

          <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
            {/* Mobile & Tablet Horizontal Shop Switcher (<1024px) */}
            <div className="mb-6 lg:hidden">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff660c]">
                  Shop Archive ({String(activeIndex + 1).padStart(2, '0')} /{' '}
                  {String(Math.min(products.length, 6)).padStart(2, '0')})
                </span>
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300 transition-colors hover:text-[#ff660c]"
                >
                  Catalog <ArrowDown className="h-3.5 w-3.5 text-[#ff660c]" />
                </a>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {products.slice(0, 6).map((item, idx) => {
                  const itemMeta = getProductEditorialMeta(item.slug, idx)
                  const isSelected = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveIndex(idx)
                        setQty(1)
                      }}
                      className={`group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                        isSelected
                          ? 'border-[#ff660c] bg-[#ff660c] text-[#01121a] shadow-[0_0_20px_rgba(255,102,12,0.35)]'
                          : 'border-white/15 bg-[#041b26]/90 text-slate-300 hover:border-[#ff660c]/60 hover:text-white'
                      }`}
                    >
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                      <span>{item.name}</span>
                      {itemMeta.badge ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                            isSelected
                              ? 'bg-[#01121a] text-[#ff660c]'
                              : 'bg-[#ff660c]/20 text-[#ff660c]'
                          }`}
                        >
                          {itemMeta.badge}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3-Column Desktop Grid / Stacked Mobile-Tablet Layout (Zero Overlap) */}
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
              {/* Column 1 (Desktop): Shop Piece Switcher Rail */}
              <aside
                className="hidden lg:col-span-3 lg:flex lg:flex-col lg:justify-between lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[#041b26]/75 lg:p-6 lg:backdrop-blur-md"
                aria-label="Shop pieces"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="font-display text-lg font-extrabold uppercase tracking-[0.2em] text-white">
                      Shop
                    </h2>
                    <span className="rounded-full border border-[#ff660c]/40 bg-[#ff660c]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff660c]">
                      Drop 01
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    {products.slice(0, 6).map((item, idx) => {
                      const itemMeta = getProductEditorialMeta(item.slug, idx)
                      const isSelected = idx === activeIndex
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveIndex(idx)
                            setQty(1)
                          }}
                          className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border border-[#ff660c]/50 bg-[#ff660c]/15 text-white shadow-[0_4px_20px_rgba(255,102,12,0.12)]'
                              : 'border border-transparent text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 pr-2">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full transition-all duration-300 ${
                                isSelected
                                  ? 'scale-110 bg-[#ff660c] shadow-[0_0_8px_#ff660c]'
                                  : 'bg-slate-600 group-hover:bg-slate-400'
                              }`}
                            />
                            <span
                              className={`text-sm leading-snug tracking-[0.02em] ${
                                isSelected ? 'font-bold text-white' : 'font-medium'
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>
                          {itemMeta.badge ? (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                                isSelected
                                  ? 'bg-[#ff660c] text-[#01121a]'
                                  : 'border border-[#ff660c]/40 bg-[#ff660c]/15 text-[#ff660c]'
                              }`}
                            >
                              {itemMeta.badge}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <a
                  href="#catalog"
                  className="mt-8 flex items-center justify-between rounded-xl border border-white/10 bg-[#01121a]/80 px-4 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-200 transition-all duration-300 hover:border-[#ff660c] hover:text-[#ff660c]"
                >
                  <span>Full Catalog</span>
                  <ArrowDown className="h-4 w-4 text-[#ff660c] transition-transform duration-300 group-hover:translate-y-0.5" />
                </a>
              </aside>

              {/* Column 2 (Center on Desktop, Below Viewer on Mobile): Editorial Copy, Specs & Controls */}
              <section
                key={activeProduct.id}
                className="animate-mk-fade-up order-2 flex flex-col justify-between lg:order-none lg:col-span-5"
                aria-live="polite"
              >
                <div>
                  {/* Subheading / Eyebrow */}
                  <div className="inline-flex items-center rounded-full border border-[#ff660c]/35 bg-[#ff660c]/10 px-3.5 py-1.5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff660c]">
                      {activeMeta.eyebrow}
                    </p>
                  </div>

                  {/* Aggressive Brush/Street-Stroke Main Heading */}
                  <h1 className="mt-4 font-brush text-[clamp(2.75rem,5.2vw,4.75rem)] uppercase leading-[1.02] tracking-[0.02em] text-[#f8fafc] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                    {activeProduct.name}
                  </h1>

                  {/* Description with generous breathing room */}
                  <p className="mt-5 max-w-xl text-sm leading-[1.85] text-slate-300 sm:text-base">
                    {activeProduct.description}
                  </p>

                  {/* Selectors Card: Qty, Size, Price */}
                  <div className="mt-7 grid grid-cols-1 gap-4 rounded-2xl border border-white/12 bg-[#041b26]/90 p-5 shadow-xl sm:grid-cols-3 sm:gap-5">
                    <label className="flex flex-col">
                      <span className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Qty
                      </span>
                      <div className="relative">
                        <select
                          value={String(qty)}
                          onChange={(e) => setQty(Number(e.target.value))}
                          className="w-full appearance-none rounded-lg border border-white/15 bg-[#01121a] px-3.5 py-2.5 pr-8 text-sm font-semibold text-white outline-none transition-colors focus:border-[#ff660c]"
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n} className="bg-[#01121a] text-white">
                              {n}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff660c]" />
                      </div>
                    </label>

                    <label className="flex flex-col">
                      <span className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Size
                      </span>
                      <div className="relative">
                        <select
                          value={activeVariantId ?? ''}
                          onChange={(e) =>
                            setSelectedVariantByProduct((prev) => ({
                              ...prev,
                              [activeProduct.id]: e.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-lg border border-white/15 bg-[#01121a] px-3.5 py-2.5 pr-8 text-sm font-semibold text-white outline-none transition-colors focus:border-[#ff660c]"
                        >
                          {activeProduct.variants.map((v) => {
                            const oos = v.stockQty !== null && v.stockQty <= 0
                            return (
                              <option
                                key={v.id}
                                value={v.id}
                                disabled={oos}
                                className="bg-[#01121a] text-white"
                              >
                                {v.size}
                                {oos
                                  ? ' (Out)'
                                  : v.stockQty !== null && v.stockQty < 5
                                    ? ` (${v.stockQty} left)`
                                    : ''}
                              </option>
                            )
                          })}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff660c]" />
                      </div>
                    </label>

                    <div className="flex flex-col justify-between">
                      <span className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Price
                      </span>
                      <div className="flex h-[42px] items-center rounded-lg border border-[#ff660c]/30 bg-[#ff660c]/10 px-3.5 text-base font-extrabold tracking-tight text-[#ff660c]">
                        {formatNairaCompact(activeProduct.priceKobo)}
                      </div>
                    </div>
                  </div>

                  {activeStockInfo?.text ? (
                    <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ff660c]">
                      <span className="h-2 w-2 rounded-full bg-[#ff660c] shadow-[0_0_8px_#ff660c]" />
                      {activeStockInfo.text}
                    </p>
                  ) : null}

                  {/* Primary & Secondary CTAs */}
                  <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <AddToCart
                      variantId={activeVariantId}
                      qty={qty}
                      disabled={activeOutOfStock}
                      label={activeOutOfStock ? 'Out of stock' : 'Add To Cart'}
                      priceLabel={formatNairaCompact(activeProduct.priceKobo * qty)}
                      className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#ff660c] px-6 text-xs font-extrabold uppercase tracking-[0.16em] text-[#01121a] shadow-[0_10px_28px_rgba(255,102,12,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a2e] hover:shadow-[0_14px_34px_rgba(255,102,12,0.4)] disabled:cursor-not-allowed disabled:opacity-45"
                    />
                    <Link
                      href={`/products/${activeProduct.slug}`}
                      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-[#041b26] px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff660c] hover:text-[#ff660c]"
                    >
                      <Eye className="h-4 w-4 text-[#ff660c]" />
                      Inspect Piece
                    </Link>
                  </div>
                </div>

                {/* Feature Specifications Grid (Replaces cramped vertical rotated boxes) */}
                <div className="mt-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Garment Architecture &amp; Specs
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {activeMeta.features.map((feature, idx) => (
                      <div
                        key={feature}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#041b26]/75 p-3.5 transition-all duration-300 hover:border-[#ff660c]/60 hover:bg-[#072330]"
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff660c]">
                          0{idx + 1}
                        </span>
                        <span className="mt-1.5 block text-xs font-semibold leading-snug text-slate-200 group-hover:text-white">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Column 3 (Right on Desktop, First on Mobile): Interactive 3D / Studio Media Stage */}
              <div className="order-1 lg:order-none lg:col-span-4">
                <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#072330] via-[#041b26] to-[#01121a] p-4 shadow-2xl sm:min-h-[520px] lg:min-h-[580px]">
                  {/* Top Bar inside Viewer Stage */}
                  <div className="z-10 flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-[#01121a]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 backdrop-blur-md">
                      {activeMeta.modelUrl ? '3D Studio Inspection' : 'Editorial Lookbook'}
                    </span>
                    <span className="font-brush text-xl text-[#ff660c]">
                      {String(activeIndex + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Media or 3D Model */}
                  <div className="relative my-auto flex h-[340px] w-full items-center justify-center sm:h-[420px] lg:h-[450px]">
                    {activeMeta.modelUrl ? (
                      <ModelViewer
                        src={activeMeta.modelUrl}
                        poster={activeProduct.images[0]}
                        alt={activeProduct.name}
                        className="hero-3d relative flex h-full w-full items-center justify-center"
                      />
                    ) : (
                      <div className="relative flex h-full w-full items-center justify-center p-4">
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-4 shadow-inner">
                          <img
                            src={activeProduct.images[0] ?? '/assets/57c8a.png'}
                            alt={activeProduct.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Pagination & Next/Prev Controls */}
                  <div className="z-10 mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                    <div
                      className="flex items-center gap-1.5"
                      aria-label="Product showcase pagination"
                    >
                      {products.slice(0, 6).map((item, idx) => {
                        const isCurrent = idx === activeIndex
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveIndex(idx)
                              setQty(1)
                            }}
                            aria-label={`Show ${item.name}`}
                            className={`h-8 rounded-lg px-2.5 text-xs font-bold transition-all duration-300 ${
                              isCurrent
                                ? 'bg-[#ff660c] text-[#01121a] shadow-[0_0_12px_rgba(255,102,12,0.45)]'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Previous piece"
                        onClick={() => {
                          setActiveIndex(
                            (prev) => (prev - 1 + products.length) % products.length,
                          )
                          setQty(1)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#01121a] text-white transition-all duration-200 hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next piece"
                        onClick={() => {
                          setActiveIndex((prev) => (prev + 1) % products.length)
                          setQty(1)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#01121a] text-white transition-all duration-200 hover:border-[#ff660c] hover:bg-[#ff660c] hover:text-[#01121a]"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Full Storefront Collection Grid */}
      <section id="catalog" className="page-shell !pt-16">
        <p className="page-kicker">Lagos Studio / Active Collection</p>
        <div className="page-title-row">
          <h2>Collection</h2>
          <span>{String(filteredProducts.length).padStart(2, '0')} pieces</span>
        </div>

        <label className="large-search">
          <Search className="h-5 w-5 text-[#ff660c]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by piece, fabric, or size…"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          ) : null}
        </label>

        {filteredProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        ) : (
          <div className="empty-state mt-10">
            <strong>No pieces match &ldquo;{search}&rdquo;.</strong>
            <p>Try searching for hoodie, tank, jorts, tee, or shell.</p>
            <button type="button" onClick={() => setSearch('')}>
              Show full collection
            </button>
          </div>
        )}
      </section>
    </>
  )
}
