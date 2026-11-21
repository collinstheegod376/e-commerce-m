import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * POST /api/orders/[reference]/retry -> { authorizationUrl } (failed orders only)
 * TODO(HANDOFF-TO-AGENT-4): Re-initialize Paystack checkout for a failed order with a fresh Paystack ref.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const user = await requireApiUser()
    const { reference } = await context.params

    const order = await prisma.order.findUnique({
      where: { reference },
      select: { id: true, userId: true, status: true, totalKobo: true },
    })

    if (!order) {
      return jsonError(404, 'Order not found.', 'NOT_FOUND')
    }

    if (order.userId !== user.id && user.role !== 'admin') {
      return jsonError(403, 'You do not have access to this order.', 'FORBIDDEN')
    }

    if (order.status !== 'failed') {
      return jsonError(400, 'Only failed orders can be retried.', 'INVALID_STATUS')
    }

    return NextResponse.json(
      {
        error:
          'Paystack payment retry is stubbed pending Agent 4 handoff (TODO(HANDOFF-TO-AGENT-4)).',
        code: 'AGENT_4_STUB',
      },
      { status: 501 },
    )
  } catch (err) {
    return handleRouteError(err, 'orders/[reference]/retry:POST')
  }
}
