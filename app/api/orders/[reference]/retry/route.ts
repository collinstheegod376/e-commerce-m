import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import {
  generateOrderReference,
  initializePaystackTransaction,
  isPaystackConfigured,
} from '@/lib/paystack'
import { checkRateLimit, extractClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { getSupportConfig } from '@/lib/support'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * POST /api/orders/[reference]/retry -> { authorizationUrl, reference } (failed orders only)
 * Re-initializes Paystack checkout for a failed order using a fresh Paystack reference.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  try {
    const user = await requireApiUser()
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`order-retry:${user.id}:${ip}`, 5, 60)
    if (!limit.allowed) {
      return jsonError(
        429,
        'Too many payment retry attempts. Please wait a minute and try again.',
        'RATE_LIMITED',
        rateLimitHeaders(limit),
      )
    }

    const { reference } = await context.params

    if (!isPaystackConfigured()) {
      return jsonError(
        503,
        'Paystack payments are not configured yet. Please set PAYSTACK_SECRET_KEY in your environment.',
        'PAYSTACK_NOT_CONFIGURED',
      )
    }

    const order = await prisma.order.findUnique({
      where: { reference },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { active: true } } },
            },
          },
        },
      },
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

    // Re-check stock availability before retrying payment
    for (const item of order.items) {
      if (!item.variant.product.active) {
        return jsonError(
          400,
          `${item.productNameSnap} (${item.sizeSnap}) is no longer available.`,
          'PRODUCT_UNAVAILABLE',
        )
      }
      if (item.variant.stockQty !== null && item.qty > item.variant.stockQty) {
        return jsonError(
          400,
          `Insufficient stock for ${item.productNameSnap} (${item.sizeSnap}).`,
          'INSUFFICIENT_STOCK',
        )
      }
    }

    const freshPaystackRef = generateOrderReference('MKR')
    const support = getSupportConfig()
    const callbackUrl = `${support.siteUrl.replace(/\/$/, '')}/profile?order=${encodeURIComponent(order.reference)}`

    const paystack = await initializePaystackTransaction({
      email: order.customerEmail,
      amountKobo: order.totalKobo,
      reference: freshPaystackRef,
      callbackUrl,
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
        userId: order.userId,
        retry: true,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'pending',
        paystackRef: freshPaystackRef,
      },
    })

    return NextResponse.json({
      authorizationUrl: paystack.authorizationUrl,
      reference: order.reference,
    })
  } catch (err) {
    return handleRouteError(err, 'orders/[reference]/retry:POST')
  }
}
