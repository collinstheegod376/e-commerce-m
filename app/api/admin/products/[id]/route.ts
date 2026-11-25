import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { nairaToKobo } from '@/lib/money'
import { ApiError, handleRouteError } from '@/lib/http'

const patchProductSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  priceKobo: z.number().int().min(100).optional(),
  priceNaira: z.number().positive().optional(),
  active: z.boolean().optional(),
  images: z
    .array(z.string().trim().min(1, 'Image URL cannot be empty'))
    .min(5, 'A product must have 1 main image and at least 4 additional inspection images (5 total).')
    .max(12, 'Maximum 12 product images allowed.')
    .optional(),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { id: 'asc' } },
      },
    })

    if (!product) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND')
    }

    return NextResponse.json({ product })
  } catch (err) {
    return handleRouteError(err, 'admin/products/[id]:GET')
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params
    const body = patchProductSchema.parse(await request.json())

    const resolvedPriceKobo =
      body.priceNaira !== undefined ? nairaToKobo(body.priceNaira) : body.priceKobo

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(resolvedPriceKobo !== undefined ? { priceKobo: resolvedPriceKobo } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.images !== undefined ? { images: body.images } : {}),
      },
      include: {
        variants: { orderBy: { id: 'asc' } },
      },
    })

    return NextResponse.json({ product })
  } catch (err) {
    return handleRouteError(err, 'admin/products/[id]:PATCH')
  }
}

/**
 * Soft-delete ONLY (sets active = false). Hard-deleting products is forbidden.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params

    const product = await prisma.product.update({
      where: { id },
      data: { active: false },
      include: {
        variants: { orderBy: { id: 'asc' } },
      },
    })

    return NextResponse.json({ product })
  } catch (err) {
    return handleRouteError(err, 'admin/products/[id]:DELETE')
  }
}
