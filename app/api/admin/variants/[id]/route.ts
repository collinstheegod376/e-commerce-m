import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { ApiError, handleRouteError } from '@/lib/http'

const patchVariantSchema = z.object({
  size: z.string().trim().min(1).max(40).optional(),
  sku: z.string().trim().max(80).nullable().optional(),
  stockQty: z.number().int().min(0).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params
    const body = patchVariantSchema.parse(await request.json())

    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(body.size !== undefined ? { size: body.size } : {}),
        ...(body.sku !== undefined ? { sku: body.sku && body.sku.length > 0 ? body.sku : null } : {}),
        ...(body.stockQty !== undefined ? { stockQty: body.stockQty } : {}),
      },
    })

    return NextResponse.json({ variant })
  } catch (err) {
    return handleRouteError(err, 'admin/variants/[id]:PATCH')
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params

    // Prevent deleting a variant that is referenced by historical orders
    const orderItemCount = await prisma.orderItem.count({ where: { variantId: id } })
    if (orderItemCount > 0) {
      throw new ApiError(
        409,
        'Cannot remove a variant that appears on past orders. Set stock to 0 instead.',
        'VARIANT_HAS_ORDERS',
      )
    }

    await prisma.productVariant.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleRouteError(err, 'admin/variants/[id]:DELETE')
  }
}
