'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, Loader2, ShoppingBag } from 'lucide-react'
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
  const [justAdded, setJustAdded] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleAdd() {
    if (!variantId || disabled || loading || justAdded) return
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
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
      onAdded?.(data)
    } catch {
      setFeedback({ type: 'err', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const isButtonDisabled = disabled || !variantId || loading || justAdded

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={isButtonDisabled}
        onClick={handleAdd}
        aria-busy={loading}
        className={
          className ??
          `flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] transition-all duration-200 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
            justAdded
              ? 'bg-emerald-500 text-[#01121a] shadow-[0_8px_22px_rgba(16,185,129,0.35)]'
              : 'bg-[#ff660c] text-[#01121a] hover:bg-[#ff7a2e] hover:shadow-[0_8px_22px_rgba(255,102,12,0.35)]'
          }`
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : justAdded ? (
          <Check className="h-4 w-4 shrink-0 stroke-[3]" aria-hidden="true" />
        ) : (
          <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{loading ? 'Adding…' : justAdded ? 'Added to cart!' : label}</span>
        {priceLabel && !loading && !justAdded ? (
          <strong className="text-[11px] opacity-80">· {priceLabel}</strong>
        ) : null}
      </button>

      {feedback ? (
        <p
          role="status"
          aria-live="polite"
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
