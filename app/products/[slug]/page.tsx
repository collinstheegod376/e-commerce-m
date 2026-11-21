import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await requireUser(`/products/${slug}`)

  const [product, cart] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, active: true },
      include: {
        variants: {
          orderBy: { id: 'asc' },
          select: { id: true, size: true, sku: true, stockQty: true },
        },
      },
    }),
    getCartResponse(user.id),
  ])

  if (!product) {
    notFound()
  }

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell">
        <ProductDetailClient product={product} />
      </section>
    </main>
  )
}
