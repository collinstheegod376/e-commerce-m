import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { ApiError, handleRouteError } from '@/lib/http'

const createVariantSchema = z.object({
  size: z.string().trim().min(1, 'Size is required').max(40),
  sku: z.string().trim().max(80).nullable().optional(),
  stockQty: z.number().int().min(0).nullable().optional(),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id: productId } = await context.params
    const body = createVariantSchema.parse(await request.json())

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND')
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size: body.size,
        sku: body.sku && body.sku.length > 0 ? body.sku : null,
        stockQty: body.stockQty === undefined ? null : body.stockQty,
      },
    })

    return NextResponse.json({ variant }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'admin/products/[id]/variants:POST')
  }
}
