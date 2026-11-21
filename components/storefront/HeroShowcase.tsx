'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
        <section className="storefront" aria-label="Featured drop showcase">
          <img className="guide-lines" src="/assets/b6522.svg" alt="" />

          <aside className="side-menu" aria-label="Shop pieces">
            <h2>Shop</h2>
            <div className="category-list">
              {products.slice(0, 6).map((item, idx) => {
                const itemMeta = getProductEditorialMeta(item.slug, idx)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={idx === activeIndex ? 'selected' : ''}
                    onClick={() => {
                      setActiveIndex(idx)
                      setQty(1)
                    }}
                  >
                    {item.name}
                    {itemMeta.badge ? <span>{itemMeta.badge}</span> : null}
                  </button>
                )
              })}
            </div>
            <a href="#catalog" className="info-label">
              <h2>Catalog ↓</h2>
            </a>
          </aside>

          <section className="product-content" aria-live="polite">
            <p className="eyebrow">{activeMeta.eyebrow}</p>
            <h1 className="!text-[clamp(3.2rem,6.5vw,6.4rem)] !tracking-[-0.07em] !whitespace-normal">
              {activeProduct.name}
            </h1>
            <p className="description">{activeProduct.description}</p>

            <div className="selectors">
              <label>
                <span>Qty</span>
                <select
                  value={String(qty)}
                  onChange={(e) => setQty(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Size</span>
                <select
                  value={activeVariantId ?? ''}
                  onChange={(e) =>
                    setSelectedVariantByProduct((prev) => ({
                      ...prev,
                      [activeProduct.id]: e.target.value,
                    }))
                  }
                >
                  {activeProduct.variants.map((v) => {
                    const oos = v.stockQty !== null && v.stockQty <= 0
                    return (
                      <option key={v.id} value={v.id} disabled={oos}>
                        {v.size}
                        {oos
                          ? ' (Out of stock)'
                          : v.stockQty !== null && v.stockQty < 5
                            ? ` (Only ${v.stockQty} left)`
                            : ''}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label>
                <span>Price</span>
                <div className="border-b border-[rgb(117_117_117/38%)] pb-2 text-sm font-semibold text-[#030304]">
                  {formatNairaCompact(activeProduct.priceKobo)}
                </div>
              </label>
            </div>

            {activeStockInfo?.text ? (
              <p className="notice !text-[#ff5331]">{activeStockInfo.text}</p>
            ) : null}

            <div className="product-actions items-start">
              <AddToCart
                variantId={activeVariantId}
                qty={qty}
                disabled={activeOutOfStock}
                label={activeOutOfStock ? 'Out of stock' : 'Add To Cart'}
                priceLabel={formatNairaCompact(activeProduct.priceKobo)}
                className="add-button"
              />
              <Link
                href={`/products/${activeProduct.slug}`}
                className="intro-button flex h-[72px] w-[185px] items-center justify-center gap-2 rounded-[8px] border border-[#808080] bg-white text-sm text-[#030304] transition-transform hover:-translate-y-0.5"
              >
                <img src="/assets/8203c.svg" alt="" className="h-5 w-5" />
                Inspect Piece
              </Link>
            </div>

            <div className="feature-rail">
              {activeMeta.features.map((feature, idx) => (
                <button key={feature} type="button" title={feature}>
                  {idx === 0 ? <img src="/assets/7ebb4.svg" alt="" /> : null}
                  {idx === activeMeta.features.length - 1 ? (
                    <img src="/assets/5f9c0.svg" alt="" />
                  ) : null}
                  <span>{feature}</span>
                </button>
              ))}
            </div>
          </section>

          {activeMeta.modelUrl ? (
            <ModelViewer
              src={activeMeta.modelUrl}
              poster={activeProduct.images[0]}
              alt={activeProduct.name}
            />
          ) : (
            <div className="hero-image hero-image-contain">
              <img
                src={activeProduct.images[0] ?? '/assets/57c8a.png'}
                alt={activeProduct.name}
              />
            </div>
          )}

          <aside className="pagination" aria-label="Product showcase pagination">
            {products.slice(0, 6).map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={idx === activeIndex ? 'current' : ''}
                onClick={() => {
                  setActiveIndex(idx)
                  setQty(1)
                }}
                aria-label={`Show ${item.name}`}
              >
                {String(idx + 1).padStart(2, '0')}
              </button>
            ))}
          </aside>

          <div className="carousel-controls">
            <img className="control-shape" src="/assets/d1fbc.svg" alt="" />
            <button
              type="button"
              aria-label="Previous piece"
              onClick={() =>
                setActiveIndex((prev) => (prev - 1 + products.length) % products.length)
              }
            >
              <img className="previous-arrow" src="/assets/74217.svg" alt="" />
            </button>
            <button
              type="button"
              aria-label="Next piece"
              onClick={() => setActiveIndex((prev) => (prev + 1) % products.length)}
            >
              <img src="/assets/13807.svg" alt="" />
            </button>
          </div>
        </section>
      ) : null}

      {/* Full Storefront Grid with per-card sizes + stock + add to cart */}
      <section id="catalog" className="page-shell !pt-16">
        <p className="page-kicker">Lagos Studio / Active Collection</p>
        <div className="page-title-row">
          <h2 className="text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] tracking-[-0.07em]">
            Collection
          </h2>
          <span>{String(filteredProducts.length).padStart(2, '0')} pieces</span>
        </div>

        <label className="large-search">
          <img src="/assets/331af.svg" alt="" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by piece, fabric, or size…"
          />
          {search ? (
            <button type="button" onClick={() => setSearch('')}>
              Clear
            </button>
          ) : null}
        </label>

        {filteredProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-px bg-[#d6d6d6] sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        ) : (
          <div className="empty-state mt-10 border border-[#d6d6d6]">
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
