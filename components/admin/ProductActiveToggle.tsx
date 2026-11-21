'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProductActiveToggleProps {
  productId: string
  active: boolean
}

export function ProductActiveToggle({ productId, active }: ProductActiveToggleProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
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
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={`border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] disabled:opacity-45 ${
        active
          ? 'border-[#d6d6d6] text-[#4a4a4a] hover:border-red-500 hover:text-red-700'
          : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {busy ? '…' : active ? 'Deactivate' : 'Activate'}
    </button>
  )
}
