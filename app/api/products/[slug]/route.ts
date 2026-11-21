import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleRouteError, jsonError } from '@/lib/http'

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params

    const product = await prisma.product.findFirst({
      where: { slug, active: true },
      include: {
        variants: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            size: true,
            sku: true,
            stockQty: true,
          },
        },
      },
    })

    if (!product) {
      return jsonError(404, 'Product not found.', 'NOT_FOUND')
    }

    return NextResponse.json({ product })
  } catch (err) {
    return handleRouteError(err, 'products/[slug]:GET')
  }
}
