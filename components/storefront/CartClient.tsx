'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CartResponse } from '@/lib/cart'
import { formatNaira, formatShippingAddress } from '@/lib/money'
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
  const hasDeliveryInfo = Boolean(profileSummary.phone && addressText !== 'Not provided')

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
          className="mt-6 border-l-2 border-[#ff5331] bg-[#fff5f2] px-4 py-3 text-sm text-[#030304]"
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mt-6 border-l-2 border-[#030304] bg-[#f7f7f5] px-4 py-3 text-sm text-[#030304]"
        >
          {notice}
        </div>
      ) : null}

      {cart.items.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-list">
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

          <aside className="order-summary">
            <p>Order summary</p>
            <div>
              <span>Subtotal</span>
              <strong>{formatNaira(cart.subtotalKobo)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>Calculated at checkout</strong>
            </div>
            <div className="summary-total">
              <span>Estimated Subtotal</span>
              <strong>{formatNaira(cart.subtotalKobo)}</strong>
            </div>

            <div className="checkout-client-box">
              <div className="checkout-client-header">
                <span>Deliver to</span>
                <Link
                  href="/profile"
                  className="border-b border-white pb-0.5 text-[10px] uppercase tracking-[0.06em] text-white"
                >
                  {hasDeliveryInfo ? 'Edit profile' : 'Add details'}
                </Link>
              </div>
              {hasDeliveryInfo ? (
                <div className="checkout-client-details">
                  <strong>{profileSummary.name || profileSummary.email}</strong>
                  <span>{profileSummary.phone}</span>
                  <span>{addressText}</span>
                </div>
              ) : (
                <p className="checkout-client-missing">
                  Add your phone number and delivery address in Profile so our Lagos courier can
                  reach you.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={checkoutBusy}
              onClick={handleCheckout}
              className="disabled:opacity-50"
            >
              {checkoutBusy ? 'Initializing Paystack…' : 'Checkout with Paystack'}
            </button>
            <small>Final order total & shipping are verified server-side on checkout.</small>
          </aside>
        </div>
      ) : (
        <div className="empty-state cart-empty mt-10 border border-[#d6d6d6]">
          <strong>Your cart is empty.</strong>
          <p>Explore our active collection and select your size to begin.</p>
          <Link
            href="/"
            className="mt-6 border-b border-[#030304] pb-1 text-xs font-medium uppercase tracking-[0.06em]"
          >
            Explore the collection
          </Link>
        </div>
      )}
    </>
  )
}
