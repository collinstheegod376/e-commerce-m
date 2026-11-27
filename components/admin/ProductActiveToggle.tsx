'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProductActiveToggleProps {
  productId: string
  active: boolean
}

export function ProductActiveToggle({ productId, active }: ProductActiveToggleProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isLoading = busy || isPending

  async function toggle() {
    if (isLoading) return
    setBusy(true)
    try {
      if (active) {
        // Soft delete (active = false)
        await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true }),
        })
      }
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={toggle}
      aria-busy={isLoading}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? 'border-[#d6d6d6] text-[#4a4a4a] hover:border-red-500 hover:text-red-700'
          : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>Updating…</span>
        </>
      ) : active ? (
        'Deactivate'
      ) : (
        'Activate'
      )}
    </button>
  )
}
