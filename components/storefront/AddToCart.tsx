'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { CartResponse } from '@/lib/cart'

interface AddToCartProps {
  variantId: string | null
  qty: number
  disabled?: boolean
  label?: string
  priceLabel?: string
  className?: string
  onAdded?: (cart: CartResponse) => void
}

export function AddToCart({
  variantId,
  qty,
  disabled = false,
  label = 'Add To Cart',
  priceLabel,
  className,
  onAdded,
}: AddToCartProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleAdd() {
    if (!variantId || disabled || loading) return
    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, qty }),
      })

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
        return
      }

      const data = (await res.json()) as CartResponse & { error?: string }
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'Unable to add item to cart.' })
        return
      }

      const count = data.items.reduce((sum, i) => sum + i.qty, 0)
      window.dispatchEvent(new CustomEvent('mk:cart-updated', { detail: { count } }))
      setFeedback({ type: 'ok', text: 'Added to cart' })
      onAdded?.(data)
    } catch {
      setFeedback({ type: 'err', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={disabled || !variantId || loading}
        onClick={handleAdd}
        className={
          className ??
          'flex w-full items-center justify-center gap-2.5 bg-[#030304] px-5 py-3.5 text-xs font-medium uppercase tracking-[0.06em] text-white transition-all hover:bg-[#1e1e20] disabled:cursor-not-allowed disabled:opacity-45'
        }
      >
        <img src="/assets/167f0.svg" alt="" className="h-4 w-3.5" />
        <span>{loading ? 'Adding…' : label}</span>
        {priceLabel ? <strong className="text-[11px] opacity-70">{priceLabel}</strong> : null}
      </button>

      {feedback ? (
        <p
          role="status"
          className={
            feedback.type === 'ok'
              ? 'text-xs text-[#1f9d55]'
              : 'text-xs text-[#ff5331]'
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  )
}
