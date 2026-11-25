'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, MapPin, Package } from 'lucide-react'
import { formatLagosDate, formatNaira } from '@/lib/money'
import { type OrderTrackingTimestamps, getStatusLabel } from '@/lib/order-status'
import { OrderTrackingStepper } from '@/components/storefront/OrderTrackingStepper'

interface ProfileAddress {
  username?: string
  altPhone?: string
  streetAddress?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  deliveryNotes?: string
}

interface ProfileOrderItem {
  id: string
  productNameSnap: string
  sizeSnap: string
  unitPriceKobo: number
  qty: number
}

interface ProfileOrderRow {
  id: string
  reference: string
  status: string
  subtotalKobo: number
  shippingKobo: number
  totalKobo: number
  createdAt: string
  paidAt: string | null
  shippingAddressText: string
  itemsSummary: string
  items: ProfileOrderItem[]
  trackingMeta: OrderTrackingTimestamps
}

interface ProfileClientProps {
  profile: {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: string
    address: ProfileAddress | null
  }
  orders: ProfileOrderRow[]
}

function getStatusPillStyle(status: string): string {
  switch (status) {
    case 'delivered':
    case 'fulfilled':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
    case 'sent_out':
    case 'confirmed':
      return 'border-[#ff660c]/45 bg-[#ff660c]/15 text-[#ff8a47]'
    case 'paid':
    case 'waiting_confirmation':
      return 'border-amber-400/40 bg-amber-400/10 text-amber-300'
    case 'failed':
    case 'cancelled':
    case 'refunded':
    case 'abandoned':
      return 'border-red-500/40 bg-red-500/15 text-red-300'
    default:
      return 'border-white/20 bg-white/5 text-slate-300'
  }
}

export function ProfileClient({ profile, orders }: ProfileClientProps) {
  const router = useRouter()
  const addr = profile.address ?? {}

  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [username, setUsername] = useState(addr.username ?? '')
  const [altPhone, setAltPhone] = useState(addr.altPhone ?? '')
  const [streetAddress, setStreetAddress] = useState(addr.streetAddress ?? '')
  const [city, setCity] = useState(addr.city ?? '')
  const [stateRegion, setStateRegion] = useState(addr.state ?? '')
  const [postalCode, setPostalCode] = useState(addr.postalCode ?? '')
  const [country, setCountry] = useState(addr.country ?? 'Nigeria')
  const [deliveryNotes, setDeliveryNotes] = useState(addr.deliveryNotes ?? '')

  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const initials = (name.trim() || profile.email)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  const isCheckoutReady = Boolean(phone.trim() && streetAddress.trim() && city.trim())

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || null,
          address: {
            username: username.trim() || undefined,
            altPhone: altPhone.trim() || undefined,
            streetAddress: streetAddress.trim() || undefined,
            city: city.trim() || undefined,
            state: stateRegion.trim() || undefined,
            postalCode: postalCode.trim() || undefined,
            country: country.trim() || undefined,
            deliveryNotes: deliveryNotes.trim() || undefined,
          },
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not save profile.')
        return
      }
      setNotice('Client details saved to your account.')
      router.refresh()
    } catch {
      setError('Network error while saving profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="page-title-row">
        <h1>Profile</h1>
        <div className="profile-status">
          <span className={isCheckoutReady ? 'ready' : ''} />
          {isCheckoutReady ? 'Checkout ready' : 'Complete delivery details'}
        </div>
      </div>

      <div className="profile-grid">
        <aside className="profile-card">
          <div className="avatar">{initials || 'MK'}</div>
          <span>{profile.role === 'admin' ? 'Studio Admin' : 'Verified Member'}</span>
          <h2>{name.trim() || 'Client Profile'}</h2>
          <p>{profile.email}</p>

          <div className="profile-summary-list">
            <div>
              <span>Primary Phone</span>
              <strong>{phone.trim() || 'Not set'}</strong>
            </div>
            <div>
              <span>Delivery Address</span>
              <strong>
                {[streetAddress.trim(), city.trim(), stateRegion.trim(), country.trim()]
                  .filter(Boolean)
                  .join(', ') || 'Not set'}
              </strong>
            </div>
          </div>

          <div className="profile-card-actions mt-6">
            {profile.role === 'admin' ? (
              <Link
                href="/admin"
                className="border-b border-[#ff5331] pb-1 text-xs font-medium uppercase tracking-[0.06em] text-[#ff5331]"
              >
                Open Admin Dashboard →
              </Link>
            ) : null}
            <Link
              href="/cart"
              className="mt-2 border-b border-white/25 pb-1 text-xs font-medium uppercase tracking-[0.06em] text-slate-200 transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
            >
              View Cart
            </Link>
            <button type="button" disabled={signingOut} onClick={handleSignOut}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        <div className="profile-content">
          <section>
            <div className="section-heading">
              <div>
                <span>01</span>
                <h2>Client details &amp; delivery address</h2>
              </div>
              <span>{isCheckoutReady ? 'Ready' : 'Incomplete'}</span>
            </div>

            <form className="client-form" onSubmit={handleSave}>
              <div className="client-form-grid">
                <label>
                  <span>Full Name *</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tunde Adebayo"
                  />
                </label>

                <label>
                  <span>Handle / Username</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@tunde"
                  />
                </label>

                <label>
                  <span>Primary Phone Number *</span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                  />
                </label>

                <label>
                  <span>Secondary Phone</span>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="Optional backup number"
                  />
                </label>

                <label className="span-2">
                  <span>Street Address *</span>
                  <input
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="14 Admiralty Way, Lekki Phase 1"
                  />
                </label>

                <label>
                  <span>City *</span>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lagos"
                  />
                </label>

                <label>
                  <span>State</span>
                  <input
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="Lagos State"
                  />
                </label>

                <label>
                  <span>Postal Code</span>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="106104"
                  />
                </label>

                <label>
                  <span>Country</span>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Nigeria"
                  />
                </label>

                <label className="span-2">
                  <span>Delivery Notes</span>
                  <input
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Estate gate code, landmark, or drop-off note"
                  />
                </label>
              </div>

              {error ? (
                <p role="alert" className="mt-4 text-xs text-[#ff5331]">
                  {error}
                </p>
              ) : null}

              <div className="client-form-footer">
                <button className="primary-action disabled:opacity-50" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save client details'}
                </button>
                {notice ? (
                  <p className="client-form-notice" role="status">
                    {notice}
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          <section>
            <div className="section-heading">
              <div>
                <span>02</span>
                <h2>Order history</h2>
              </div>
              <span>{orders.length} total</span>
            </div>

            {orders.length > 0 ? (
              <div className="mt-5 space-y-3.5">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id
                  const statusLabel = getStatusLabel(order.status)

                  return (
                    <div
                      key={order.id}
                      className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
                        isExpanded
                          ? 'border-[#ff660c]/45 bg-[#041b26]'
                          : 'border-white/12 bg-[#041b26]/70 hover:border-white/25'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`order-details-${order.id}`}
                        onClick={() =>
                          setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                        }
                        className="flex w-full flex-col gap-3 p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-[#f8fafc]">
                              {order.reference}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusPillStyle(
                                order.status,
                              )}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-300">
                            {order.itemsSummary || 'Maison Kriss Order'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatLagosDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-[#ff660c]">
                              {formatNaira(order.totalKobo)}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                              {isExpanded ? 'Hide tracking' : 'Track order'}
                            </p>
                          </div>
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                              isExpanded
                                ? 'border-[#ff660c]/60 bg-[#ff660c]/15 text-[#ff660c]'
                                : 'border-white/15 bg-[#01121a] text-slate-300'
                            }`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-300 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </button>

                      {/* Smooth Accordion Dropdown Panel */}
                      <div
                        id={`order-details-${order.id}`}
                        className={`grid transition-all duration-300 ease-out ${
                          isExpanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-5 border-t border-white/10 bg-[#01121a]/60 p-4 sm:p-6">
                            {/* Live Order Delivery Status Stepper */}
                            <OrderTrackingStepper
                              status={order.status}
                              timestamps={order.trackingMeta}
                              theme="dark"
                              compact
                            />

                            {/* Itemized Breakdown & Delivery Details */}
                            <div className="rounded-xl border border-white/10 bg-[#041b26]/70 p-4 sm:p-5">
                              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff660c]">
                                  <Package className="h-3.5 w-3.5" aria-hidden="true" />
                                  Items Breakdown
                                </span>
                                <span className="text-xs text-slate-400">
                                  {order.items.reduce((sum, item) => sum + item.qty, 0)} piece(s)
                                </span>
                              </div>

                              <div className="mt-3 divide-y divide-white/10">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 py-2.5 text-xs sm:text-sm"
                                  >
                                    <div>
                                      <p className="font-semibold text-[#f8fafc]">
                                        {item.productNameSnap}
                                      </p>
                                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
                                        Size {item.sizeSnap} · Qty {item.qty}
                                      </p>
                                    </div>
                                    <span className="shrink-0 font-semibold text-slate-200">
                                      {formatNaira(item.unitPriceKobo * item.qty)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs">
                                <div className="flex justify-between text-slate-400">
                                  <span>Subtotal</span>
                                  <span>{formatNaira(order.subtotalKobo)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>Shipping</span>
                                  <span>
                                    {order.shippingKobo === 0
                                      ? 'Complimentary'
                                      : formatNaira(order.shippingKobo)}
                                  </span>
                                </div>
                                <div className="flex justify-between pt-1 text-sm font-bold text-[#f8fafc]">
                                  <span>Total</span>
                                  <span className="text-[#ff660c]">
                                    {formatNaira(order.totalKobo)}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="flex items-start gap-1.5 text-xs text-slate-400">
                                  <MapPin
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff660c]"
                                    aria-hidden="true"
                                  />
                                  <span>{order.shippingAddressText}</span>
                                </p>
                                <Link
                                  href={`/orders/${encodeURIComponent(order.reference)}/confirmation`}
                                  className="inline-flex shrink-0 items-center gap-1.5 self-start border-b border-[#ff660c] pb-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff660c] transition-colors hover:border-white hover:text-white sm:self-auto"
                                >
                                  <span>View Confirmation Receipt</span>
                                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="order-placeholder">
                <p>No orders yet</p>
                <strong>Your confirmed orders will appear here after Paystack checkout.</strong>
                <span>—</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
