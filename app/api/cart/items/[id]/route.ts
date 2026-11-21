import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { ApiError, handleRouteError } from '@/lib/http'

const patchItemSchema = z.object({
  qty: z.number().int().min(0, 'Quantity cannot be negative').max(50, 'Maximum 50 per item'),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    const { id } = await context.params
    const body = patchItemSchema.parse(await request.json())

    await prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: {
          id,
          cart: { userId: user.id },
        },
        include: {
          variant: {
            include: {
              product: { select: { active: true } },
            },
          },
        },
      })

      if (!item) {
        throw new ApiError(404, 'Cart item not found.', 'NOT_FOUND')
      }

      if (body.qty === 0) {
        await tx.cartItem.delete({ where: { id: item.id } })
        return
      }

      if (!item.variant.product.active) {
        throw new ApiError(400, 'This product is no longer active.', 'PRODUCT_INACTIVE')
      }

      if (item.variant.stockQty !== null && body.qty > item.variant.stockQty) {
        throw new ApiError(
          400,
          `Only ${item.variant.stockQty} left in stock for size ${item.variant.size}.`,
          'INSUFFICIENT_STOCK',
        )
      }

      await tx.cartItem.update({
        where: { id: item.id },
        data: { qty: body.qty },
      })
    })

    const cart = await getCartResponse(user.id)
    return NextResponse.json(cart)
  } catch (err) {
    return handleRouteError(err, 'cart/items/[id]:PATCH')
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    const { id } = await context.params

    const deleted = await prisma.cartItem.deleteMany({
      where: {
        id,
        cart: { userId: user.id },
      },
    })

    if (deleted.count === 0) {
      throw new ApiError(404, 'Cart item not found.', 'NOT_FOUND')
    }

    const cart = await getCartResponse(user.id)
    return NextResponse.json(cart)
  } catch (err) {
    return handleRouteError(err, 'cart/items/[id]:DELETE')
  }
}
