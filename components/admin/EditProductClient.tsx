'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/money'
import {
  MIN_PRODUCT_IMAGES,
  ProductImageUploader,
} from '@/components/admin/ProductImageUploader'

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const

interface AdminVariant {
  id: string
  size: string
  sku: string | null
  stockQty: number | null
}

interface AdminProduct {
  id: string
  slug: string
  name: string
  description: string | null
  priceKobo: number
  active: boolean
  images: string[]
  variants: AdminVariant[]
}

interface EditProductClientProps {
  product: AdminProduct
}

export function EditProductClient({ product }: EditProductClientProps) {
  const router = useRouter()

  const [name, setName] = useState(product.name)
  const [slug, setSlug] = useState(product.slug)
  const [description, setDescription] = useState(product.description ?? '')
  const [priceNaira, setPriceNaira] = useState(String(product.priceKobo / 100))
  const [images, setImages] = useState<string[]>(product.images)
  const [active, setActive] = useState(product.active)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productNotice, setProductNotice] = useState('')
  const [productError, setProductError] = useState('')

  const [variants, setVariants] = useState<AdminVariant[]>(product.variants)
  const [newSize, setNewSize] = useState('')
  const [newSku, setNewSku] = useState('')
  const [newStock, setNewStock] = useState('')
  const [variantBusyId, setVariantBusyId] = useState<string | null>(null)
  const [variantNotice, setVariantNotice] = useState('')
  const [variantError, setVariantError] = useState('')

  const totalTrackedPieces = variants.reduce(
    (sum, v) => (typeof v.stockQty === 'number' && v.stockQty >= 0 ? sum + v.stockQty : sum),
    0,
  )

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProductNotice('')
    setProductError('')

    const parsedNaira = Number(priceNaira)
    if (!Number.isFinite(parsedNaira) || parsedNaira <= 0) {
      setProductError('Enter a valid price in Naira (₦).')
      return
    }

    const cleanedImages = images.map((url) => url.trim()).filter(Boolean)
    if (cleanedImages.length < MIN_PRODUCT_IMAGES) {
      setProductError('Upload at least 1 main show image before saving this product.')
      return
    }

    setSavingProduct(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          priceNaira: parsedNaira,
          active,
          images: cleanedImages,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setProductError(data.error || 'Could not update product.')
        return
      }
      setProductNotice('Product changes saved.')
      router.refresh()
    } catch {
      setProductError('Network error saving product.')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleSaveVariant(
    variantId: string,
    draft: { size: string; sku: string; stockQty: string },
  ) {
    setVariantBusyId(variantId)
    setVariantError('')
    setVariantNotice('')

    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: draft.size.trim(),
          sku: draft.sku.trim() || null,
          stockQty: draft.stockQty.trim() === '' ? null : Number(draft.stockQty),
        }),
      })
      const data = (await res.json()) as { variant?: AdminVariant; error?: string }
      if (!res.ok) {
        setVariantError(data.error || 'Could not save size.')
        return
      }
      if (data.variant) {
        setVariants((prev) => prev.map((v) => (v.id === variantId ? data.variant! : v)))
      }
      setVariantNotice('Size & inventory updated.')
      router.refresh()
    } catch {
      setVariantError('Network error saving size.')
    } finally {
      setVariantBusyId(null)
    }
  }

  async function handleDeleteVariant(variantId: string) {
    setVariantBusyId(variantId)
    setVariantError('')
    setVariantNotice('')

    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setVariantError(data.error || 'Could not remove size.')
        return
      }
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
      setVariantNotice('Size removed.')
      router.refresh()
    } catch {
      setVariantError('Network error removing size.')
    } finally {
      setVariantBusyId(null)
    }
  }

  async function handleAddVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSize.trim()) return

    setVariantBusyId('new')
    setVariantError('')
    setVariantNotice('')

    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: newSize.trim(),
          sku: newSku.trim() || null,
          stockQty: newStock.trim() === '' ? null : Number(newStock),
        }),
      })
      const data = (await res.json()) as { variant?: AdminVariant; error?: string }
      if (!res.ok) {
        setVariantError(data.error || 'Could not add size.')
        return
      }
      if (data.variant) {
        setVariants((prev) => [...prev, data.variant!])
      }
      setNewSize('')
      setNewSku('')
      setNewStock('')
      setVariantNotice('Size added.')
      router.refresh()
    } catch {
      setVariantError('Network error adding size.')
    } finally {
      setVariantBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Product Details & Photography Form */}
      <form
        onSubmit={handleSaveProduct}
        className="border border-[#e2e2de] bg-white p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em]">Product Details</h2>
          <span className="text-xs text-[#6a6a6a]">
            Current stored price: <strong>{formatNaira(product.priceKobo)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Name
            </span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Slug
            </span>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 font-mono text-xs outline-none focus:border-[#030304]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Price in Naira (₦)
            </span>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
            />
          </label>

          <label className="flex items-center gap-2.5 pt-6 text-xs font-medium text-[#030304]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[#030304]"
            />
            <span>Active (visible in storefront)</span>
          </label>
        </div>

        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
            Description
          </span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
          />
        </label>

        <div className="border-t border-[#ecece8] pt-5">
          <ProductImageUploader
            images={images}
            onChange={setImages}
            disabled={savingProduct}
          />
        </div>

        {productError ? (
          <div
            role="alert"
            className="border-l-2 border-[#ff5331] bg-[#fff5f2] px-4 py-3 text-xs text-[#030304]"
          >
            {productError}
          </div>
        ) : null}
        {productNotice ? <p className="text-xs font-medium text-emerald-700">{productNotice}</p> : null}

        <button
          type="submit"
          disabled={savingProduct}
          className="bg-[#030304] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] disabled:opacity-50"
        >
          {savingProduct ? 'Saving…' : 'Save Product'}
        </button>
      </form>

      {/* Available Sizes & Pieces Available Manager */}
      <div className="border border-[#e2e2de] bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
              Available Sizes &amp; Pieces Available ({variants.length})
            </h2>
            <p className="mt-0.5 text-[11px] text-[#757575]">
              Changes save immediately. Leave Pieces Available blank for untracked stock, or set 0 for out of stock.
            </p>
          </div>
          <span className="border border-[#e2e2de] bg-[#fafaf8] px-2.5 py-1 text-[11px] font-semibold text-[#030304]">
            Total Tracked: {totalTrackedPieces} pcs
          </span>
        </div>

        {variantError ? <p className="text-xs text-[#ff5331]">{variantError}</p> : null}
        {variantNotice ? <p className="text-xs text-emerald-700">{variantNotice}</p> : null}

        {variants.length > 0 ? (
          <div className="hidden grid-cols-12 gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[#6a6a6a] sm:grid">
            <span className="col-span-3">Available Size</span>
            <span className="col-span-4">SKU (Optional)</span>
            <span className="col-span-2">Pieces Available</span>
            <span className="col-span-3 text-right">Actions</span>
          </div>
        ) : null}

        <div className="space-y-3">
          {variants.map((v) => (
            <VariantEditorRow
              key={v.id}
              variant={v}
              busy={variantBusyId === v.id}
              onSave={(draft) => handleSaveVariant(v.id, draft)}
              onDelete={() => handleDeleteVariant(v.id)}
            />
          ))}
        </div>

        {/* Quick-Add Size Presets + Add Form */}
        <div className="mt-6 border-t border-[#ecece8] pt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6a6a6a]">
              Quick-add sizes:
            </span>
            {SIZE_PRESETS.map((preset) => {
              const exists = variants.some(
                (v) => v.size.trim().toLowerCase() === preset.toLowerCase(),
              )
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={exists}
                  onClick={() => {
                    setNewSize(preset)
                    if (!newStock) setNewStock('10')
                  }}
                  className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                    exists
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 cursor-default'
                      : 'border-[#d6d6d6] bg-white text-[#030304] hover:border-[#030304] hover:bg-[#030304] hover:text-white'
                  }`}
                >
                  {exists ? `✓ ${preset}` : `+ ${preset}`}
                </button>
              )
            })}
          </div>

          <form
            onSubmit={handleAddVariant}
            className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-end"
          >
            <label className="sm:col-span-3">
              <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                Available Size
              </span>
              <input
                required
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="XXL / One Size"
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
            </label>
            <label className="sm:col-span-4">
              <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                SKU (optional)
              </span>
              <input
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="MK-SKU-XXL"
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2 font-mono text-xs outline-none focus:border-[#030304]"
              />
            </label>
            <label className="sm:col-span-3">
              <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
                Pieces Available
              </span>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Blank = untracked"
                className="mt-1 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
            </label>
            <button
              type="submit"
              disabled={variantBusyId === 'new'}
              className="sm:col-span-2 bg-[#030304] px-3 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] disabled:opacity-50"
            >
              + Add Size
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function VariantEditorRow({
  variant,
  busy,
  onSave,
  onDelete,
}: {
  variant: AdminVariant
  busy: boolean
  onSave: (draft: { size: string; sku: string; stockQty: string }) => void
  onDelete: () => void
}) {
  const [size, setSize] = useState(variant.size)
  const [sku, setSku] = useState(variant.sku ?? '')
  const [stockQty, setStockQty] = useState(
    variant.stockQty === null ? '' : String(variant.stockQty),
  )

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center border border-[#ecece8] bg-[#fafaf8] p-3">
      <input
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Available Size"
        aria-label="Available Size"
        className="sm:col-span-3 border border-[#d6d6d6] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#030304]"
      />
      <input
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="SKU"
        aria-label="SKU"
        className="sm:col-span-4 border border-[#d6d6d6] bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-[#030304]"
      />
      <input
        type="number"
        min="0"
        value={stockQty}
        onChange={(e) => setStockQty(e.target.value)}
        placeholder="Untracked"
        aria-label="Pieces Available"
        className="sm:col-span-2 border border-[#d6d6d6] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#030304]"
      />
      <div className="sm:col-span-3 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSave({ size, sku, stockQty })}
          className="border border-[#030304] bg-[#030304] px-3 py-1.5 text-[11px] font-medium uppercase text-white hover:bg-[#1f1f22] disabled:opacity-45"
        >
          {busy ? '…' : 'Save'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="border border-[#d6d6d6] bg-white px-2.5 py-1.5 text-[11px] text-red-700 hover:border-red-500 disabled:opacity-45"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
