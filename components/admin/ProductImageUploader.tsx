'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'

export const MIN_INSPECTION_IMAGES = 4
export const MIN_PRODUCT_IMAGES = 1 + MIN_INSPECTION_IMAGES // 5 total
export const MAX_PRODUCT_IMAGES = 12

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/avif'

interface ProductImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
}

export function ProductImageUploader({
  images,
  onChange,
  disabled = false,
}: ProductImageUploaderProps) {
  const mainInputRef = useRef<HTMLInputElement | null>(null)
  const addInspectInputRef = useRef<HTMLInputElement | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)

  const [replaceTargetIdx, setReplaceTargetIdx] = useState<number | null>(null)
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [dragOverZone, setDragOverZone] = useState<'main' | 'inspect' | null>(null)

  const mainImage = images[0] ?? null
  const inspectionImages = images.slice(1)
  const hasMain = Boolean(mainImage)
  const inspectionCount = inspectionImages.length
  const meetsMinimum = hasMain && inspectionCount >= MIN_INSPECTION_IMAGES
  const isBusy = disabled || uploadingStatus !== null

  async function uploadSingleFile(file: File): Promise<string> {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      throw new Error(
        `"${file.name}" has an unsupported format. Use JPEG, PNG, WebP, or AVIF.`,
      )
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`"${file.name}" exceeds the 8MB maximum file size.`)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/uploads', {
      method: 'POST',
      body: formData,
    })

    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      throw new Error(data.error || `Failed to upload "${file.name}".`)
    }

    return data.url
  }

  async function uploadFilesForMode(
    fileList: FileList | File[],
    mode: 'main' | 'append' | 'replace',
    targetIndex?: number,
  ) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    setUploadError('')

    if (mode === 'replace' && typeof targetIndex === 'number') {
      const file = files[0]
      setUploadingStatus('Replacing image…')
      try {
        const url = await uploadSingleFile(file)
        const next = [...images]
        next[targetIndex] = url
        onChange(next)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
      } finally {
        setUploadingStatus(null)
        setReplaceTargetIdx(null)
      }
      return
    }

    if (mode === 'main') {
      // If user drops/selects multiple files on Main, slot 0 gets the first and extras append as inspection images.
      const remainingExtraSlots = Math.max(
        0,
        MAX_PRODUCT_IMAGES - (images.length > 0 ? images.length : 1),
      )
      const filesToUpload = files.slice(0, 1 + remainingExtraSlots)

      if (files.length > filesToUpload.length) {
        setUploadError(`Only ${MAX_PRODUCT_IMAGES} total images are allowed. Extra files were skipped.`)
      }

      const uploadedUrls: string[] = []
      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          setUploadingStatus(
            filesToUpload.length > 1
              ? `Uploading image ${i + 1} of ${filesToUpload.length}…`
              : 'Uploading main image…',
          )
          const url = await uploadSingleFile(filesToUpload[i])
          uploadedUrls.push(url)
        }

        if (uploadedUrls.length > 0) {
          const [firstUrl, ...extraUrls] = uploadedUrls
          const next =
            images.length > 0
              ? [firstUrl, ...images.slice(1), ...extraUrls].slice(0, MAX_PRODUCT_IMAGES)
              : [firstUrl, ...extraUrls].slice(0, MAX_PRODUCT_IMAGES)
          onChange(next)
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
      } finally {
        setUploadingStatus(null)
      }
      return
    }

    // mode === 'append'
    const remainingSlots = MAX_PRODUCT_IMAGES - images.length
    if (remainingSlots <= 0) {
      setUploadError(`Maximum of ${MAX_PRODUCT_IMAGES} images reached.`)
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setUploadError(
        `Maximum of ${MAX_PRODUCT_IMAGES} total images allowed. Uploading first ${remainingSlots} file(s).`,
      )
    }

    const uploadedUrls: string[] = []
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadingStatus(
          filesToUpload.length > 1
            ? `Uploading image ${i + 1} of ${filesToUpload.length}…`
            : 'Uploading inspection image…',
        )
        const url = await uploadSingleFile(filesToUpload[i])
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls].slice(0, MAX_PRODUCT_IMAGES))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls].slice(0, MAX_PRODUCT_IMAGES))
      }
    } finally {
      setUploadingStatus(null)
    }
  }

  function handleMainFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      void uploadFilesForMode(e.target.files, 'main')
    }
    e.target.value = ''
  }

  function handleAppendFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      void uploadFilesForMode(e.target.files, 'append')
    }
    e.target.value = ''
  }

  function handleReplaceFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length && replaceTargetIdx !== null) {
      void uploadFilesForMode(e.target.files, 'replace', replaceTargetIdx)
    }
    e.target.value = ''
  }

  function triggerReplace(index: number) {
    setReplaceTargetIdx(index)
    replaceInputRef.current?.click()
  }

  function handleSetAsMain(index: number) {
    if (index <= 0 || index >= images.length) return
    const next = [...images]
    const selected = next[index]
    next[index] = next[0]
    next[0] = selected
    onChange(next)
  }

  function handleMoveInspection(index: number, direction: -1 | 1) {
    const target = index + direction
    if (index < 1 || target < 1 || target >= images.length) return
    const next = [...images]
    const tmp = next[target]
    next[target] = next[index]
    next[index] = tmp
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = images.filter((_, i) => i !== index)
    onChange(next)
  }

  function handleDragOver(e: DragEvent<HTMLElement>, zone: 'main' | 'inspect') {
    e.preventDefault()
    if (!isBusy) {
      setDragOverZone(zone)
    }
  }

  function handleDragLeave(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    setDragOverZone(null)
  }

  function handleDrop(e: DragEvent<HTMLElement>, zone: 'main' | 'inspect') {
    e.preventDefault()
    setDragOverZone(null)
    if (isBusy) return
    const files = e.dataTransfer.files
    if (files?.length) {
      void uploadFilesForMode(files, zone === 'main' ? 'main' : 'append')
    }
  }

  // Always show at least 4 inspection slots (Inspect 1..4) plus any extra uploaded ones.
  const inspectionSlotCount = Math.max(MIN_INSPECTION_IMAGES, inspectionImages.length)
  const canAddMore = images.length < MAX_PRODUCT_IMAGES

  return (
    <div className="space-y-5">
      {/* Hidden File Inputs */}
      <input
        ref={mainInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        onChange={handleMainFileChange}
        className="hidden"
        disabled={isBusy}
      />
      <input
        ref={addInspectInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        onChange={handleAppendFileChange}
        className="hidden"
        disabled={isBusy}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleReplaceFileChange}
        className="hidden"
        disabled={isBusy}
      />

      {/* Header & Live Requirement Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#030304]">
            Product Photography (1 Main + 4+ Inspection Required)
          </h3>
          <p className="mt-0.5 text-[11px] text-[#757575]">
            JPEG, PNG, WebP, or AVIF up to 8MB each. Max {MAX_PRODUCT_IMAGES} images total.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[11px] font-semibold ${
            meetsMinimum
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-[#ff660c]/40 bg-[#fff5f0] text-[#b83b00]'
          }`}
        >
          {meetsMinimum ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-[#ff5331]" />
          )}
          <span>
            Main Image: {hasMain ? '✓' : 'Missing'} &nbsp;|&nbsp; Inspection Images:{' '}
            {inspectionCount} / {MIN_INSPECTION_IMAGES} minimum {inspectionCount >= MIN_INSPECTION_IMAGES ? '✓' : ''}
          </span>
          <span className="ml-1 text-[10px] opacity-75">
            ({images.length}/{MAX_PRODUCT_IMAGES})
          </span>
        </div>
      </div>

      {/* Upload Progress / Error Banners */}
      {uploadingStatus ? (
        <div className="flex items-center gap-2 border border-[#030304]/20 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-medium text-[#030304]">
          <Loader2 className="h-4 w-4 animate-spin text-[#ff660c]" />
          <span>{uploadingStatus}</span>
        </div>
      ) : null}

      {uploadError ? (
        <div
          role="alert"
          className="border-l-2 border-[#ff5331] bg-[#fff5f2] px-3.5 py-2.5 text-xs text-[#030304]"
        >
          {uploadError}
        </div>
      ) : null}

      {/* Main Show Image (Slot 0) */}
      <div
        onDragOver={(e) => handleDragOver(e, 'main')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'main')}
        className={`border p-4 transition-colors ${
          dragOverZone === 'main'
            ? 'border-[#ff660c] bg-[#fff8f4]'
            : 'border-[#e2e2de] bg-[#fafaf8]'
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#030304] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              <Star className="h-3 w-3 fill-[#ff660c] text-[#ff660c]" />
              Main Show Image (Required)
            </span>
            <p className="mt-1 text-[11px] text-[#6a6a6a]">
              Featured on storefront catalog cards and as the hero display on the product page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => mainInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 border border-[#030304] bg-[#030304] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-white hover:bg-[#1f1f22] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {hasMain ? 'Replace Main Image' : 'Upload Main Image'}
            </button>
            {hasMain ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleRemove(0)}
                className="inline-flex items-center gap-1 border border-[#d6d6d6] bg-white px-2.5 py-1.5 text-[11px] text-red-700 hover:border-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {mainImage ? (
          <div className="relative flex h-64 w-full items-center justify-center overflow-hidden border border-[#e2e2de] bg-white p-4">
            <img
              src={mainImage}
              alt="Main show image preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => mainInputRef.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 border border-dashed border-[#c8c8c4] bg-white text-center transition-colors hover:border-[#030304] disabled:opacity-50"
          >
            <Upload className="h-6 w-6 text-[#6a6a6a]" />
            <span className="text-xs font-semibold text-[#030304]">
              Click to upload or drag &amp; drop Main Show Image
            </span>
            <span className="text-[11px] text-[#757575]">
              Tip: Select 5+ images at once to fill Main + Inspection slots automatically
            </span>
          </button>
        )}
      </div>

      {/* Inspection Gallery Images (Slots 1–4+) */}
      <div
        onDragOver={(e) => handleDragOver(e, 'inspect')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'inspect')}
        className={`border p-4 transition-colors ${
          dragOverZone === 'inspect'
            ? 'border-[#ff660c] bg-[#fff8f4]'
            : 'border-[#e2e2de] bg-white'
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.06em] text-[#030304]">
              Inspection Gallery Images (Minimum {MIN_INSPECTION_IMAGES} Required)
            </h4>
            <p className="mt-0.5 text-[11px] text-[#6a6a6a]">
              Detail shots, back views, fabric close-ups, and styling angles shown in &ldquo;Inspect Piece&rdquo;.
            </p>
          </div>
          {canAddMore ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => addInspectInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 border border-[#030304] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-[#030304] hover:bg-[#030304] hover:text-white disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              + Add Inspection Images
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: inspectionSlotCount }).map((_, slotOffset) => {
            const globalIdx = slotOffset + 1
            const url = images[globalIdx]
            const label = `Inspect ${slotOffset + 1}`

            if (!url) {
              return (
                <button
                  key={`empty-slot-${slotOffset}`}
                  type="button"
                  disabled={isBusy}
                  onClick={() => addInspectInputRef.current?.click()}
                  className="flex min-h-[196px] flex-col items-center justify-center gap-2 border border-dashed border-[#c8c8c4] bg-[#fafaf8] p-4 text-center transition-colors hover:border-[#030304] hover:bg-white disabled:opacity-50"
                >
                  <span className="border border-[#d6d6d6] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#6a6a6a]">
                    {label}
                  </span>
                  <ImagePlus className="h-5 w-5 text-[#757575]" />
                  <span className="text-[11px] font-medium text-[#030304]">Upload Image</span>
                  <span className="text-[10px] text-[#757575]">Required slot</span>
                </button>
              )
            }

            const canMoveLeft = globalIdx > 1
            const canMoveRight = globalIdx < images.length - 1

            return (
              <div
                key={`${url}-${globalIdx}`}
                className="flex flex-col border border-[#e2e2de] bg-[#fafaf8]"
              >
                <div className="flex items-center justify-between border-b border-[#ecece8] px-2.5 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#030304]">
                    {label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isBusy || !canMoveLeft}
                      onClick={() => handleMoveInspection(globalIdx, -1)}
                      title="Move Left"
                      aria-label={`Move ${label} left`}
                      className="border border-[#d6d6d6] bg-white p-1 text-[#030304] hover:border-[#030304] disabled:opacity-35"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || !canMoveRight}
                      onClick={() => handleMoveInspection(globalIdx, 1)}
                      title="Move Right"
                      aria-label={`Move ${label} right`}
                      className="border border-[#d6d6d6] bg-white p-1 text-[#030304] hover:border-[#030304] disabled:opacity-35"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex h-36 items-center justify-center bg-white p-2">
                  <img
                    src={url}
                    alt={`${label} preview`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="mt-auto grid grid-cols-3 gap-1 border-t border-[#ecece8] p-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSetAsMain(globalIdx)}
                    title="Swap into Main Show Image"
                    className="col-span-3 inline-flex items-center justify-center gap-1 border border-[#030304] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#030304] hover:bg-[#030304] hover:text-white disabled:opacity-45"
                  >
                    <Star className="h-3 w-3" />
                    Set as Main
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => triggerReplace(globalIdx)}
                    className="col-span-2 inline-flex items-center justify-center gap-1 border border-[#d6d6d6] bg-white px-2 py-1 text-[10px] font-medium text-[#030304] hover:border-[#030304] disabled:opacity-45"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRemove(globalIdx)}
                    aria-label={`Remove ${label}`}
                    className="col-span-1 inline-flex items-center justify-center border border-[#d6d6d6] bg-white px-2 py-1 text-[10px] text-red-700 hover:border-red-500 disabled:opacity-45"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* "+ Add More Inspection Image" card when 4+ inspection images exist and under max */}
          {inspectionImages.length >= MIN_INSPECTION_IMAGES && canAddMore ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => addInspectInputRef.current?.click()}
              className="flex min-h-[196px] flex-col items-center justify-center gap-2 border border-dashed border-[#c8c8c4] bg-[#fafaf8] p-4 text-center transition-colors hover:border-[#030304] hover:bg-white disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5 text-[#030304]" />
              <span className="text-[11px] font-semibold text-[#030304]">
                + Add More Inspection Image
              </span>
              <span className="text-[10px] text-[#757575]">
                Up to {MAX_PRODUCT_IMAGES - images.length} more
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
