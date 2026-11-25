import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { issuePaystackRefund } from '@/lib/paystack'
import { emails } from '@/lib/emails'
import { ApiError, handleRouteError } from '@/lib/http'

const patchOrderSchema = z.object({
  status: z.enum([
    'paid',
    'waiting_confirmation',
    'confirmed',
    'sent_out',
    'delivered',
    'fulfilled',
    'cancelled',
    'refunded',
  ]),
  note: z.string().trim().max(300).optional(),
  estimatedDelivery: z.string().trim().max(120).optional(),
})

const TRACKING_AND_REFUND_TARGETS = new Set([
  'paid',
  'waiting_confirmation',
  'confirmed',
  'sent_out',
  'delivered',
  'fulfilled',
  'refunded',
])

/**
 * Allowed admin order status transitions:
 *  - Full forward/backward control across the 5 tracking stages
 *    (paid, waiting_confirmation, confirmed, sent_out, delivered) + legacy fulfilled,
 *    plus refunding any paid/tracking stage via Paystack.
 *  - pending | failed | abandoned -> paid (manual verification) or cancelled.
 */
const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  paid: TRACKING_AND_REFUND_TARGETS,
  waiting_confirmation: TRACKING_AND_REFUND_TARGETS,
  confirmed: TRACKING_AND_REFUND_TARGETS,
  sent_out: TRACKING_AND_REFUND_TARGETS,
  delivered: TRACKING_AND_REFUND_TARGETS,
  fulfilled: TRACKING_AND_REFUND_TARGETS,
  pending: new Set(['paid', 'cancelled']),
  failed: new Set(['paid', 'cancelled']),
  abandoned: new Set(['paid', 'cancelled']),
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

    const updateData: { status: string; paidAt?: Date } = { status: body.status }
    if (body.status === 'paid' && !existing.paidAt) {
      updateData.paidAt = new Date()
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: updateData,
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
            estimatedDelivery: body.estimatedDelivery ?? null,
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

    const shouldSendStatusEmail =
      (body.status === 'confirmed' ||
        body.status === 'sent_out' ||
        body.status === 'delivered') &&
      existing.status !== body.status
        ? true
        : body.status === 'paid' &&
          (existing.status === 'pending' ||
            existing.status === 'failed' ||
            existing.status === 'abandoned')

    if (shouldSendStatusEmail) {
      await Promise.allSettled([
        emails.sendOrderStatusUpdate(
          updatedOrder,
          body.status as 'paid' | 'confirmed' | 'sent_out' | 'delivered',
          {
            note: body.note,
            estimatedDelivery: body.estimatedDelivery,
          },
        ),
      ])
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (err) {
    return handleRouteError(err, 'admin/orders/[id]:PATCH')
  }
}
