import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * GET /api/orders/[reference] -> order detail (owner or admin only)
 * TODO(HANDOFF-TO-AGENT-4): Expand if Agent 4 adds customer receipt/status enrichment.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const user = await requireApiUser()
    const { reference } = await context.params

    const order = await prisma.order.findUnique({
      where: { reference },
      include: {
        items: true,
      },
    })

    if (!order) {
      return jsonError(404, 'Order not found.', 'NOT_FOUND')
    }

    if (order.userId !== user.id && user.role !== 'admin') {
      return jsonError(403, 'You do not have access to this order.', 'FORBIDDEN')
    }

    return NextResponse.json({ order })
  } catch (err) {
    return handleRouteError(err, 'orders/[reference]:GET')
  }
}
