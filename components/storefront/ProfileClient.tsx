'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatLagosDate, formatNaira } from '@/lib/money'

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

interface ProfileOrderRow {
  id: string
  reference: string
  status: string
  totalKobo: number
  createdAt: string
  itemsSummary: string
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
              className="mt-2 border-b border-[#030304] pb-1 text-xs font-medium uppercase tracking-[0.06em]"
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
              orders.map((order) => (
                <div className="order-placeholder" key={order.id}>
                  <div>
                    <p>{order.reference}</p>
                    <small>{formatLagosDate(order.createdAt)}</small>
                  </div>
                  <div>
                    <strong>{order.itemsSummary || 'Maison Kriss Order'}</strong>
                  </div>
                  <span>
                    {order.status} · {formatNaira(order.totalKobo)}
                  </span>
                </div>
              ))
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
