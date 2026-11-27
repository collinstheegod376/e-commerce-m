import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { formatShippingAddress } from '@/lib/money'
import { extractOrderTrackingMeta } from '@/lib/order-status'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { ProfileClient } from '@/components/storefront/ProfileClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Member Profile — Maison Kriss',
  description: 'Manage your Maison Kriss member account, delivery address, and order history.',
  alternates: { canonical: canonicalUrl('/profile') },
  robots: NOINDEX_ROBOTS,
}

export default async function ProfilePage() {
  const user = await requireUser('/profile')

  const [cart, orders] = await Promise.all([
    getCartResponse(user.id),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        items: true,
        events: {
          orderBy: { receivedAt: 'asc' },
        },
      },
    }),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  const parsedAddress =
    user.address && typeof user.address === 'object' && !Array.isArray(user.address)
      ? (user.address as Record<string, string>)
      : null

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell profile-page">
        <p className="page-kicker">Client account &amp; delivery</p>
        <ProfileClient
          profile={{
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            address: parsedAddress,
          }}
          orders={orders.map((o) => ({
            id: o.id,
            reference: o.reference,
            status: o.status,
            subtotalKobo: o.subtotalKobo,
            shippingKobo: o.shippingKobo,
            totalKobo: o.totalKobo,
            createdAt: o.createdAt.toISOString(),
            paidAt: o.paidAt ? o.paidAt.toISOString() : null,
            shippingAddressText: formatShippingAddress(o.shippingAddress),
            itemsSummary: o.items
              .map((i) => `${i.qty}× ${i.productNameSnap} (${i.sizeSnap})`)
              .join(', '),
            items: o.items.map((i) => ({
              id: i.id,
              productNameSnap: i.productNameSnap,
              sizeSnap: i.sizeSnap,
              unitPriceKobo: i.unitPriceKobo,
              qty: i.qty,
            })),
            trackingMeta: extractOrderTrackingMeta(o, o.events),
          }))}
        />
      </section>
    </main>
  )
}
