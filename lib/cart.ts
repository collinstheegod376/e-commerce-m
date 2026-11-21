import 'server-only'
import { prisma } from '@/lib/prisma'

/**
 * Exact cart contract published by Agent 3 and consumed by Agent 4 (checkout/initialize).
 */
export interface CartLineProduct {
  id: string
  slug: string
  name: string
  image: string | null
}

export interface CartLineItem {
  id: string
  variantId: string
  qty: number
  size: string
  unitPriceKobo: number
  stockQty: number | null
  product: CartLineProduct
}

export interface CartResponse {
  items: CartLineItem[]
  subtotalKobo: number
}

export interface ResolvedVariant {
  variantId: string
  size: string
  sku: string | null
  stockQty: number | null
  unitPriceKobo: number
  product: {
    id: string
    slug: string
    name: string
    active: boolean
    image: string | null
  }
}

/**
 * Fetches or auto-creates the user's cart and formats it to the exact API contract.
 */
export async function getCartResponse(userId: string): Promise<CartResponse> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        orderBy: { id: 'asc' },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  priceKobo: true,
                  images: true,
                  active: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const items: CartLineItem[] = cart.items
    .filter((item) => item.variant.product.active)
    .map((item) => ({
      id: item.id,
      variantId: item.variantId,
      qty: item.qty,
      size: item.variant.size,
      unitPriceKobo: item.variant.product.priceKobo,
      stockQty: item.variant.stockQty,
      product: {
        id: item.variant.product.id,
        slug: item.variant.product.slug,
        name: item.variant.product.name,
        image: item.variant.product.images[0] ?? null,
      },
    }))

  const subtotalKobo = items.reduce(
    (sum, item) => sum + item.unitPriceKobo * item.qty,
    0,
  )

  return { items, subtotalKobo }
}

/**
 * Resolves a single variantId to its product, size, stock, and authoritative kobo price.
 * Published by Agent 3 for Agent 4 checkout & order-item snapshotting.
 */
export async function resolveVariant(variantId: string): Promise<ResolvedVariant | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceKobo: true,
          active: true,
          images: true,
        },
      },
    },
  })

  if (!variant) return null

  return {
    variantId: variant.id,
    size: variant.size,
    sku: variant.sku,
    stockQty: variant.stockQty,
    unitPriceKobo: variant.product.priceKobo,
    product: {
      id: variant.product.id,
      slug: variant.product.slug,
      name: variant.product.name,
      active: variant.product.active,
      image: variant.product.images[0] ?? null,
    },
  }
}

/**
 * Batch resolves variantIds for checkout/order creation.
 */
export async function resolveVariants(variantIds: string[]): Promise<Map<string, ResolvedVariant>> {
  if (!variantIds.length) return new Map()
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceKobo: true,
          active: true,
          images: true,
        },
      },
    },
  })

  const map = new Map<string, ResolvedVariant>()
  for (const v of variants) {
    map.set(v.id, {
      variantId: v.id,
      size: v.size,
      sku: v.sku,
      stockQty: v.stockQty,
      unitPriceKobo: v.product.priceKobo,
      product: {
        id: v.product.id,
        slug: v.product.slug,
        name: v.product.name,
        active: v.product.active,
        image: v.product.images[0] ?? null,
      },
    })
  }
  return map
}
