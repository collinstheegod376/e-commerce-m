import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { ProfileClient } from '@/components/storefront/ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await requireUser('/profile')

  const [cart, orders] = await Promise.all([
    getCartResponse(user.id),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { items: true },
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
            totalKobo: o.totalKobo,
            createdAt: o.createdAt.toISOString(),
            itemsSummary: o.items
              .map((i) => `${i.qty}× ${i.productNameSnap} (${i.sizeSnap})`)
              .join(', '),
          }))}
        />
      </section>
    </main>
  )
}
