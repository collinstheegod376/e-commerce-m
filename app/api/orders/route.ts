import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { handleRouteError } from '@/lib/http'

/**
 * GET /api/orders -> current user's orders
 * TODO(HANDOFF-TO-AGENT-4): Extend with any additional checkout/payment metadata Agent 4 needs.
 */
export async function GET() {
  try {
    const user = await requireApiUser()

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    return handleRouteError(err, 'orders:GET')
  }
}
