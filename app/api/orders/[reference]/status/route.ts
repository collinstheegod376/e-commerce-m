import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * GET /api/orders/[reference]/status -> { status }
 * TODO(HANDOFF-TO-AGENT-4): Optionally trigger live Paystack verify fallback when pending.
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
      select: { userId: true, status: true },
    })

    if (!order) {
      return jsonError(404, 'Order not found.', 'NOT_FOUND')
    }

    if (order.userId !== user.id && user.role !== 'admin') {
      return jsonError(403, 'You do not have access to this order.', 'FORBIDDEN')
    }

    return NextResponse.json({ status: order.status })
  } catch (err) {
    return handleRouteError(err, 'orders/[reference]/status:GET')
  }
}
