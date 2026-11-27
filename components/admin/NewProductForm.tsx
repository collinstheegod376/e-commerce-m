'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import {
  MIN_PRODUCT_IMAGES,
  ProductImageUploader,
} from '@/components/admin/ProductImageUploader'

interface VariantDraft {
  size: string
  sku: string
  stockQty: string // empty string -> null (untracked)
}

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function NewProductForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [priceNaira, setPriceNaira] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: 'S', sku: '', stockQty: '10' },
    { size: 'M', sku: '', stockQty: '10' },
    { size: 'L', sku: '', stockQty: '10' },
    { size: 'XL', sku: '', stockQty: '10' },
  ])

  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isLoading = submitting || isPending
  const [error, setError] = useState('')

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  function updateVariant(idx: number, field: keyof VariantDraft, value: string) {
    setVariants((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    )
  }

  function addVariantRow(presetSize = '') {
    setVariants((prev) => [
      ...prev,
      { size: presetSize, sku: '', stockQty: presetSize ? '10' : '' },
    ])
  }

  function toggleSizePreset(preset: string) {
    const exists = variants.some(
      (v) => v.size.trim().toLowerCase() === preset.toLowerCase(),
    )
    if (exists) return
    addVariantRow(preset)
  }

  function removeVariantRow(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }

  const totalTrackedPieces = variants.reduce((sum, v) => {
    const n = Number(v.stockQty)
    return v.stockQty.trim() !== '' && Number.isFinite(n) && n >= 0 ? sum + n : sum
  }, 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    setError('')

    const parsedNaira = Number(priceNaira)
    if (!Number.isFinite(parsedNaira) || parsedNaira <= 0) {
      setError('Enter a valid price in Naira (₦).')
      return
    }

    const cleanedImages = images.map((url) => url.trim()).filter(Boolean)
    if (cleanedImages.length < MIN_PRODUCT_IMAGES) {
      setError('Upload at least 1 main show image before creating this product.')
      return
    }

    const payloadVariants = variants
      .filter((v) => v.size.trim().length > 0)
      .map((v) => ({
        size: v.size.trim(),
        sku: v.sku.trim() || null,
        stockQty: v.stockQty.trim() === '' ? null : Number(v.stockQty),
      }))

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          priceNaira: parsedNaira, // converted to kobo server-side
          images: cleanedImages,
          active,
          variants: payloadVariants,
        }),
      })
      const data = (await res.json()) as { product?: { id: string }; error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not create product.')
        setSubmitting(false)
        return
      }
      startTransition(() => {
        router.push(`/admin/products/${data.product?.id ?? ''}`)
        router.refresh()
      })
    } catch {
      setError('Network error while creating product.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="border-l-2 border-[#ff5331] bg-[#fff5f2] px-4 py-3 text-xs text-[#030304]"
        >
          {error}
        </div>
      ) : null}

      <div className="border border-[#e2e2de] bg-white p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.06em]">Product Details</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Name *
            </span>
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Lekki Heavyweight Cargo"
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Slug * (auto-generated from name)
            </span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="lekki-heavyweight-cargo"
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 font-mono text-xs outline-none focus:border-[#030304]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
              Price in Naira (₦) *
            </span>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              placeholder="75000"
              className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
            />
            <span className="mt-1 block text-[11px] text-[#757575]">
              Converted to integer kobo server-side.
            </span>
          </label>

          <label className="flex items-center gap-2.5 pt-6 text-xs font-medium text-[#030304]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[#030304]"
            />
            <span>Active on storefront immediately</span>
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
            placeholder="Fabric weight, cut, construction details…"
            className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
          />
        </label>
      </div>

      {/* Product Image Uploader */}
      <div className="border border-[#e2e2de] bg-white p-6">
        <ProductImageUploader
          images={images}
          onChange={setImages}
          disabled={submitting}
        />
      </div>

      {/* Available Sizes & Pieces Available */}
      <div className="border border-[#e2e2de] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
              Available Sizes &amp; Pieces Available
            </h2>
            <p className="mt-0.5 text-[11px] text-[#757575]">
              Set how many pieces are available per size. Leave Pieces Available blank for untracked stock, or set 0 for out of stock.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-[#e2e2de] bg-[#fafaf8] px-2.5 py-1 text-[11px] font-semibold text-[#030304]">
              Total Tracked: {totalTrackedPieces} pcs
            </span>
            <button
              type="button"
              onClick={() => addVariantRow()}
              className="border border-[#030304] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.05em] hover:bg-[#030304] hover:text-white"
            >
              + Custom Size
            </button>
          </div>
        </div>

        {/* Quick-Add Size Presets */}
        <div className="flex flex-wrap items-center gap-2 border-y border-[#ecece8] py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6a6a6a]">
            Quick-add sizes:
          </span>
          {SIZE_PRESETS.map((preset) => {
            const added = variants.some(
              (v) => v.size.trim().toLowerCase() === preset.toLowerCase(),
            )
            return (
              <button
                key={preset}
                type="button"
                disabled={added}
                onClick={() => toggleSizePreset(preset)}
                className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                  added
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 cursor-default'
                    : 'border-[#d6d6d6] bg-white text-[#030304] hover:border-[#030304] hover:bg-[#030304] hover:text-white'
                }`}
              >
                {added ? `✓ ${preset}` : `+ ${preset}`}
              </button>
            )
          })}
        </div>

        {/* Column Headers */}
        <div className="hidden grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#6a6a6a] sm:grid">
          <span className="col-span-4">Available Size</span>
          <span className="col-span-4">SKU (Optional)</span>
          <span className="col-span-3">Pieces Available</span>
          <span className="col-span-1 text-right">Remove</span>
        </div>

        <div className="space-y-2.5">
          {variants.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={row.size}
                onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                placeholder="Available Size (e.g. M, One Size)"
                aria-label="Available Size"
                className="col-span-12 sm:col-span-4 border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
              <input
                value={row.sku}
                onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                placeholder="SKU (optional)"
                aria-label="SKU"
                className="col-span-12 sm:col-span-4 border border-[#d6d6d6] px-3 py-2 font-mono text-xs outline-none focus:border-[#030304]"
              />
              <input
                type="number"
                min="0"
                value={row.stockQty}
                onChange={(e) => updateVariant(idx, 'stockQty', e.target.value)}
                placeholder="Pieces Available (blank = untracked)"
                aria-label="Pieces Available"
                className="col-span-10 sm:col-span-3 border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
              />
              <button
                type="button"
                onClick={() => removeVariantRow(idx)}
                className="col-span-2 sm:col-span-1 text-xs text-[#757575] hover:text-red-700"
                aria-label="Remove size"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="inline-flex items-center gap-2 bg-[#030304] px-6 py-3 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              <span>Creating Product…</span>
            </>
          ) : (
            'Create Product'
          )}
        </button>
      </div>
    </form>
  )
}
