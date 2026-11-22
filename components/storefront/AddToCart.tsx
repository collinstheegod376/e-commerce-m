'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
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
          'flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#ff660c] px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#01121a] transition-all duration-300 hover:bg-[#ff7a2e] hover:shadow-[0_8px_22px_rgba(255,102,12,0.35)] disabled:cursor-not-allowed disabled:opacity-45'
        }
      >
        <ShoppingBag className="h-4 w-4 shrink-0" />
        <span>{loading ? 'Adding…' : label}</span>
        {priceLabel ? <strong className="text-[11px] opacity-80">· {priceLabel}</strong> : null}
      </button>

      {feedback ? (
        <p
          role="status"
          className={
            feedback.type === 'ok'
              ? 'text-xs font-semibold text-emerald-400'
              : 'text-xs font-semibold text-[#ff660c]'
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  )
}
