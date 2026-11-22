import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { HeroShowcase } from '@/components/storefront/HeroShowcase'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await requireUser('/')

  const [products, cart] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      include: {
        variants: {
          orderBy: { id: 'asc' },
          select: { id: true, size: true, sku: true, stockQty: true },
        },
      },
    }),
    getCartResponse(user.id),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="relative min-h-screen bg-[#01121a] text-[#f8fafc]">
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <HeroShowcase products={products} />
    </main>
  )
}
