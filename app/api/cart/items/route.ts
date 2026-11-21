import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { ApiError, handleRouteError } from '@/lib/http'

const addItemSchema = z.object({
  variantId: z.string().uuid('Invalid variantId'),
  qty: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Maximum 50 per item'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser()
    const body = addItemSchema.parse(await request.json())

    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: body.variantId },
        include: {
          product: {
            select: { id: true, name: true, active: true },
          },
        },
      })

      if (!variant || !variant.product.active) {
        throw new ApiError(404, 'Selected product variant is unavailable.', 'VARIANT_UNAVAILABLE')
      }

      if (variant.stockQty !== null && variant.stockQty <= 0) {
        throw new ApiError(400, 'This size is currently out of stock.', 'OUT_OF_STOCK')
      }

      const cart = await tx.cart.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      })

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: variant.id,
          },
        },
      })

      const nextQty = (existing?.qty ?? 0) + body.qty
      if (variant.stockQty !== null && nextQty > variant.stockQty) {
        throw new ApiError(
          400,
          `Only ${variant.stockQty} left in stock for size ${variant.size}.`,
          'INSUFFICIENT_STOCK',
        )
      }

      await tx.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: variant.id,
          },
        },
        update: { qty: nextQty },
        create: {
          cartId: cart.id,
          variantId: variant.id,
          qty: body.qty,
        },
      })
    })

    const cart = await getCartResponse(user.id)
    return NextResponse.json(cart, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'cart/items:POST')
  }
}
