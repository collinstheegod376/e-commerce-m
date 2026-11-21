import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
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

    return NextResponse.json({ products })
  } catch (err) {
    return handleRouteError(err, 'products:GET')
  }
}
