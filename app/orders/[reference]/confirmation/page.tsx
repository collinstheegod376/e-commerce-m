import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { formatShippingAddress } from '@/lib/money'
import { extractOrderTrackingMeta } from '@/lib/order-status'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { OrderConfirmationClient } from '@/components/storefront/OrderConfirmationClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>
}): Promise<Metadata> {
  const { reference } = await params
  return {
    title: `Order Confirmation ${reference} — Maison Kriss`,
    description: 'Private Maison Kriss order payment and dispatch confirmation.',
    alternates: { canonical: canonicalUrl(`/orders/${reference}/confirmation`) },
    robots: NOINDEX_ROBOTS,
  }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const user = await requireUser(`/orders/${reference}/confirmation`)

  const [cart, order] = await Promise.all([
    getCartResponse(user.id),
    prisma.order.findUnique({
      where: { reference },
      include: {
        items: true,
        events: {
          orderBy: { receivedAt: 'asc' },
        },
      },
    }),
  ])

  if (!order || (order.userId !== user.id && user.role !== 'admin')) {
    notFound()
  }

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)
  const trackingMeta = extractOrderTrackingMeta(order, order.events)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell">
        <OrderConfirmationClient
          order={{
            id: order.id,
            reference: order.reference,
            status: order.status,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            subtotalKobo: order.subtotalKobo,
            shippingKobo: order.shippingKobo,
            totalKobo: order.totalKobo,
            shippingAddressText: formatShippingAddress(order.shippingAddress),
            createdAt: order.createdAt.toISOString(),
            paidAt: order.paidAt ? order.paidAt.toISOString() : null,
            items: order.items.map((item) => ({
              id: item.id,
              productNameSnap: item.productNameSnap,
              sizeSnap: item.sizeSnap,
              unitPriceKobo: item.unitPriceKobo,
              qty: item.qty,
            })),
            trackingMeta,
          }}
        />
      </section>
    </main>
  )
}
