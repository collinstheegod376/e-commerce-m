'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { CartResponse } from '@/lib/cart'
import {
  formatNaira,
  formatShippingAddress,
  getMissingDeliveryFields,
} from '@/lib/money'
import { CartLine } from '@/components/storefront/CartLine'

interface CartClientProps {
  initialCart: CartResponse
  profileSummary: {
    name: string | null
    email: string
    phone: string | null
    address: unknown
  }
}

export function CartClient({ initialCart, profileSummary }: CartClientProps) {
  const [cart, setCart] = useState<CartResponse>(initialCart)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0)
  const addressText = formatShippingAddress(profileSummary.address)
  const missingDeliveryFields = getMissingDeliveryFields({
    phone: profileSummary.phone,
    address: profileSummary.address,
  })
  const hasDeliveryInfo = missingDeliveryFields.length === 0

  function syncCart(next: CartResponse) {
    setCart(next)
    const count = next.items.reduce((sum, i) => sum + i.qty, 0)
    window.dispatchEvent(new CustomEvent('mk:cart-updated', { detail: { count } }))
  }

  async function handleUpdateQty(itemId: string, nextQty: number) {
    setBusyId(itemId)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: nextQty }),
      })
      const data = (await res.json()) as CartResponse & { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not update cart item.')
        return
      }
      syncCart(data)
    } catch {
      setError('Network error while updating cart.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(itemId: string) {
    setBusyId(itemId)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' })
      const data = (await res.json()) as CartResponse & { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not remove cart item.')
        return
      }
      syncCart(data)
    } catch {
      setError('Network error while removing item.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCheckout() {
    if (!hasDeliveryInfo || checkoutBusy) {
      if (!hasDeliveryInfo) {
        setError(
          `Please add your ${missingDeliveryFields.join(', ')} in Profile before checking out.`,
        )
      }
      return
    }
    setCheckoutBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json()) as {
        authorizationUrl?: string
        reference?: string
        error?: string
      }

      if (!res.ok) {
        setError(data.error || 'Unable to initialize checkout.')
        return
      }

      if (data.authorizationUrl) {
        setNotice(`Redirecting to Paystack for order ${data.reference ?? ''}…`)
        window.location.href = data.authorizationUrl
      }
    } catch {
      setError('Network error initializing checkout.')
    } finally {
      setCheckoutBusy(false)
    }
  }

  return (
    <>
      <div className="page-title-row">
        <h1>Cart</h1>
        <span>{String(itemCount).padStart(2, '0')} items</span>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 break-words rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/10 px-4 py-3 text-sm text-[#f8fafc]"
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mt-6 break-words rounded-lg border-l-4 border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm text-[#f8fafc]"
        >
          {notice}
        </div>
      ) : null}

      {cart.items.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-list min-w-0">
            {cart.items.map((item, idx) => (
              <CartLine
                key={item.id}
                item={item}
                index={idx}
                busy={busyId === item.id}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <aside className="order-summary w-full min-w-0 !p-5 sm:!p-8">
            <p>Order summary</p>
            <div className="gap-3">
              <span>Subtotal</span>
              <strong className="text-right">{formatNaira(cart.subtotalKobo)}</strong>
            </div>
            <div className="gap-3">
              <span>Shipping</span>
              <strong className="text-right">Calculated at checkout</strong>
            </div>
            <div className="summary-total gap-3">
              <span>Estimated Subtotal</span>
              <strong className="text-right whitespace-nowrap">{formatNaira(cart.subtotalKobo)}</strong>
            </div>

            <div className="checkout-client-box min-w-0">
              <div className="checkout-client-header flex-wrap gap-2">
                <span>Deliver to</span>
                <Link
                  href="/profile"
                  className="inline-flex min-h-[32px] items-center border-b border-[#ff660c] pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff660c] hover:text-white"
                >
                  {hasDeliveryInfo ? 'Edit profile' : 'Add details'}
                </Link>
              </div>
              {hasDeliveryInfo ? (
                <div className="checkout-client-details min-w-0 break-words [overflow-wrap:anywhere]">
                  <strong>{profileSummary.name || profileSummary.email}</strong>
                  <span>{profileSummary.phone}</span>
                  <span>{addressText}</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="checkout-client-missing break-words">
                    Delivery location is required before checkout. Missing:{' '}
                    <strong className="text-white">{missingDeliveryFields.join(', ')}</strong>.
                  </p>
                  <Link
                    href="/profile"
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-[#ff660c] bg-[#ff660c]/15 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff660c] transition-colors hover:bg-[#ff660c] hover:text-[#01121a]"
                  >
                    Fill Delivery Details in Profile →
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={checkoutBusy || !hasDeliveryInfo}
              onClick={handleCheckout}
              aria-busy={checkoutBusy}
              className="min-h-[48px] w-full flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:cursor-not-allowed disabled:opacity-45"
            >
              {checkoutBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden="true" />
                  <span>Initializing Paystack…</span>
                </>
              ) : !hasDeliveryInfo ? (
                'Add Location Details to Checkout'
              ) : (
                'Checkout with Paystack'
              )}
            </button>
            <small>Final order total &amp; shipping are verified server-side on checkout.</small>
          </aside>
        </div>
      ) : (
        <div className="empty-state cart-empty mt-10">
          <strong>Your cart is empty.</strong>
          <p>Explore our active collection and select your size to begin.</p>
          <Link
            href="/"
            className="mt-6 border-b border-[#ff660c] pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#ff660c] hover:text-white"
          >
            Explore the collection
          </Link>
        </div>
      )}
    </>
  )
}
