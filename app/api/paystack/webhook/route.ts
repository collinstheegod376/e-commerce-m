import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyPaystackSignature } from '@/lib/paystack'
import { notifier, type FullOrder } from '@/lib/notifier'
import { emails } from '@/lib/emails'
import { handleRouteError, jsonError } from '@/lib/http'

interface PaystackWebhookPayload {
  event?: string
  data?: {
    id?: number | string
    reference?: string
    amount?: number
    currency?: string
    paid_at?: string
    status?: string
    metadata?: {
      orderReference?: string
    }
  }
}

/**
 * POST /api/paystack/webhook -> 200 (idempotent)
 *
 * Processes Paystack webhook events with HMAC-SHA512 signature verification,
 * PaymentEvent idempotency, server-side amount/currency validation, atomic
 * stock decrement & cart clearing, and resilient Telegram/Resend dispatch.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!verifyPaystackSignature(rawBody, signature)) {
      console.warn(
        JSON.stringify({
          event: 'paystack.webhook.invalid_signature',
          hasSignature: Boolean(signature),
        }),
      )
      return jsonError(401, 'Invalid Paystack webhook signature.', 'INVALID_SIGNATURE')
    }

    let payload: PaystackWebhookPayload
    try {
      payload = JSON.parse(rawBody) as PaystackWebhookPayload
    } catch {
      return jsonError(400, 'Malformed webhook JSON payload.', 'INVALID_JSON')
    }

    const eventType = payload.event ?? 'unknown'
    const data = payload.data ?? {}
    const paystackRef = data.reference ?? ''
    const orderRef = data.metadata?.orderReference || paystackRef
    const paystackEventId = `${eventType}:${data.id ?? paystackRef ?? Date.now()}`

    // Locate the matching order by paystackRef or reference
    const order = orderRef
      ? await prisma.order.findFirst({
          where: {
            OR: [{ paystackRef }, { reference: orderRef }],
          },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: true,
          },
        })
      : null

    // Idempotent insert of PaymentEvent
    try {
      await prisma.paymentEvent.create({
        data: {
          paystackEventId,
          orderId: order?.id ?? null,
          type: eventType,
          payload: payload as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Duplicate webhook delivery — already processed
        return NextResponse.json({ received: true, duplicate: true })
      }
      throw err
    }

    if (!order) {
      console.warn(
        JSON.stringify({
          event: 'paystack.webhook.order_not_found',
          eventType,
          paystackRef,
          orderRef,
        }),
      )
      return NextResponse.json({ received: true })
    }

    if (eventType === 'charge.success') {
      const paidAmount = Number(data.amount ?? 0)
      const currency = String(data.currency ?? '').toUpperCase()

      if (paidAmount !== order.totalKobo || (currency && currency !== 'NGN')) {
        console.error(
          JSON.stringify({
            event: 'paystack.webhook.amount_mismatch',
            reference: order.reference,
            expectedKobo: order.totalKobo,
            receivedKobo: paidAmount,
            currency,
          }),
        )
        return NextResponse.json({ received: true, mismatch: true })
      }

      if (order.status === 'paid' || order.status === 'fulfilled' || order.status === 'refunded') {
        return NextResponse.json({ received: true, alreadyPaid: true })
      }

      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date()

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            paidAt,
            paystackRef: paystackRef || order.paystackRef,
          },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: true,
          },
        })

        // Decrement tracked variant stock (never below 0)
        for (const item of updated.items) {
          await tx.$executeRaw`
            UPDATE public.product_variants
            SET stock_qty = GREATEST(stock_qty - ${item.qty}, 0)
            WHERE id = ${item.variantId}
              AND stock_qty IS NOT NULL
          `
        }

        // Clear the customer's cart
        const userCart = await tx.cart.findUnique({
          where: { userId: order.userId },
          select: { id: true },
        })
        if (userCart) {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } })
        }

        return updated
      })

      const fullOrder: FullOrder = updatedOrder
      await Promise.allSettled([
        notifier.notifyPaidOrder(fullOrder),
        emails.sendReceipt(fullOrder),
      ])

      return NextResponse.json({ received: true, status: 'paid' })
    }

    if (eventType === 'charge.failed' && order.status === 'pending') {
      const failedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed' },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: true,
        },
      })

      await notifier.notifyFailedOrder(failedOrder)
      return NextResponse.json({ received: true, status: 'failed' })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return handleRouteError(err, 'paystack/webhook:POST')
  }
}
