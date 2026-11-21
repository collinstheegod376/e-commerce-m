import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { issuePaystackRefund } from '@/lib/paystack'
import { ApiError, handleRouteError } from '@/lib/http'

const patchOrderSchema = z.object({
  status: z.enum(['fulfilled', 'cancelled', 'refunded']),
  note: z.string().trim().max(300).optional(),
})

/**
 * Allowed admin order status transitions (documented in README-ADMIN.md for Agent 4):
 *  - paid -> fulfilled
 *  - pending | failed -> cancelled
 *  - paid | fulfilled -> refunded (calls Agent 4's issuePaystackRefund helper)
 */
const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  paid: new Set(['fulfilled', 'refunded']),
  fulfilled: new Set(['refunded']),
  pending: new Set(['cancelled']),
  failed: new Set(['cancelled']),
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                sku: true,
                product: { select: { id: true, slug: true, name: true, images: true } },
              },
            },
          },
        },
        events: {
          orderBy: { receivedAt: 'asc' },
        },
      },
    })

    if (!order) {
      throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
    }

    return NextResponse.json({ order })
  } catch (err) {
    return handleRouteError(err, 'admin/orders/[id]:GET')
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireApiAdmin()
    const { id } = await context.params
    const body = patchOrderSchema.parse(await request.json())

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
    }

    const allowedNext = ALLOWED_TRANSITIONS[existing.status]
    if (!allowedNext || !allowedNext.has(body.status)) {
      throw new ApiError(
        400,
        `Cannot transition order from "${existing.status}" to "${body.status}".`,
        'INVALID_STATUS_TRANSITION',
      )
    }

    let refundMeta: { refundReference?: string; message: string } | undefined
    if (body.status === 'refunded') {
      const refundResult = await issuePaystackRefund(
        existing.paystackRef ?? existing.reference,
        existing.totalKobo,
      )
      if (!refundResult.ok) {
        throw new ApiError(502, refundResult.message, 'PAYSTACK_REFUND_FAILED')
      }
      refundMeta = refundResult
    }

    console.info(
      JSON.stringify({
        event: 'admin.order.status_change',
        orderId: existing.id,
        reference: existing.reference,
        fromStatus: existing.status,
        toStatus: body.status,
        totalKobo: existing.totalKobo,
        adminId: admin.id,
        adminEmail: admin.email,
      }),
    )

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { status: body.status },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          events: { orderBy: { receivedAt: 'asc' } },
        },
      })

      await tx.paymentEvent.create({
        data: {
          paystackEventId: `admin:${body.status}:${existing.id}:${randomUUID()}`,
          orderId: existing.id,
          type: `admin.order.${body.status}`,
          payload: {
            actorId: admin.id,
            actorEmail: admin.email,
            fromStatus: existing.status,
            toStatus: body.status,
            note: body.note ?? null,
            refund: refundMeta ?? null,
          },
        },
      })

      return tx.order.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          events: { orderBy: { receivedAt: 'asc' } },
        },
      })
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (err) {
    return handleRouteError(err, 'admin/orders/[id]:PATCH')
  }
}
