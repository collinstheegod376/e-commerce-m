import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { isPaystackConfigured, verifyPaystackTransaction } from '@/lib/paystack'
import { notifier } from '@/lib/notifier'
import { emails } from '@/lib/emails'
import { handleRouteError, jsonError } from '@/lib/http'
import { REALIZED_REVENUE_STATUSES } from '@/lib/order-status'

const PAID_OR_POST_PAID_STATUSES = new Set<string>([
  ...REALIZED_REVENUE_STATUSES,
  'refunded',
])

/**
 * GET /api/orders/[reference]/status -> { status }
 * Includes live Paystack verify fallback when an order is still pending.
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
        user: { select: { name: true, email: true, phone: true } },
        items: true,
      },
    })

    if (!order) {
      return jsonError(404, 'Order not found.', 'NOT_FOUND')
    }

    if (order.userId !== user.id && user.role !== 'admin') {
      return jsonError(403, 'You do not have access to this order.', 'FORBIDDEN')
    }

    if (PAID_OR_POST_PAID_STATUSES.has(order.status)) {
      return NextResponse.json({ status: order.status })
    }

    if (order.status === 'pending' && isPaystackConfigured()) {
      const refToVerify = order.paystackRef || order.reference
      try {
        const verified = await verifyPaystackTransaction(refToVerify)
        if (
          verified &&
          verified.status === 'success' &&
          verified.amount === order.totalKobo &&
          verified.currency.toUpperCase() === 'NGN'
        ) {
          const eventId = `verify.success:${verified.id ?? refToVerify}`
          let createdEvent = false
          try {
            await prisma.paymentEvent.create({
              data: {
                paystackEventId: eventId,
                orderId: order.id,
                type: 'verify.charge.success',
                payload: verified.raw as Prisma.InputJsonValue,
              },
            })
            createdEvent = true
          } catch (e) {
            if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) {
              throw e
            }
          }

          if (createdEvent) {
            const txResult = await prisma.$transaction(async (tx) => {
              const current = await tx.order.findUnique({
                where: { id: order.id },
                select: { status: true },
              })

              if (current && PAID_OR_POST_PAID_STATUSES.has(current.status)) {
                return { alreadyProcessed: true as const, status: current.status }
              }

              const updated = await tx.order.update({
                where: { id: order.id },
                data: {
                  status: 'paid',
                  paidAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
                  paystackRef: refToVerify,
                },
                include: {
                  user: { select: { name: true, email: true, phone: true } },
                  items: true,
                },
              })

              for (const item of updated.items) {
                await tx.$executeRaw`
                  UPDATE public.product_variants
                  SET stock_qty = GREATEST(stock_qty - ${item.qty}, 0)
                  WHERE id = ${item.variantId}
                    AND stock_qty IS NOT NULL
                `
              }

              const userCart = await tx.cart.findUnique({
                where: { userId: order.userId },
                select: { id: true },
              })
              if (userCart) {
                await tx.cartItem.deleteMany({ where: { cartId: userCart.id } })
              }

              return { alreadyProcessed: false as const, order: updated }
            })

            if (txResult.alreadyProcessed) {
              return NextResponse.json({ status: txResult.status })
            }

            await Promise.allSettled([
              notifier.notifyPaidOrder(txResult.order),
              emails.sendReceipt(txResult.order),
            ])
            return NextResponse.json({ status: 'paid' })
          }
        } else if (verified && (verified.status === 'failed' || verified.status === 'abandoned')) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: verified.status },
          })
          return NextResponse.json({ status: verified.status })
        }
      } catch (verifyErr) {
        console.warn('[orders/status] Paystack verify fallback skipped:', verifyErr)
      }
    }

    return NextResponse.json({ status: order.status })
  } catch (err) {
    return handleRouteError(err, 'orders/[reference]/status:GET')
  }
}
