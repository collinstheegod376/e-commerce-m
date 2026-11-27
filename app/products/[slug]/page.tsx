import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { canonicalUrl, NOINDEX_ROBOTS } from '@/lib/seo'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient'
import { Breadcrumbs } from '@/components/storefront/Breadcrumbs'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    select: { name: true, description: true },
  })

  if (!product) {
    return {
      title: 'Piece Not Found — Maison Kriss',
      robots: NOINDEX_ROBOTS,
    }
  }

  return {
    title: `${product.name} — Maison Kriss`,
    description:
      product.description?.slice(0, 160) ??
      `${product.name} by Maison Kriss Lagos Contemporary Studio.`,
    alternates: {
      canonical: canonicalUrl(`/products/${slug}`),
    },
    robots: NOINDEX_ROBOTS,
  }
}

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
      <img className="guide-lines" src="/assets/b6522.svg" alt="" width={1200} height={800} />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell">
        <Breadcrumbs
          items={[
            { label: 'Collection', href: '/' },
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />
        <ProductDetailClient product={product} />
      </section>
    </main>
  )
}
