import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import {
  generateOrderReference,
  initializePaystackTransaction,
  isPaystackConfigured,
} from '@/lib/paystack'
import { checkRateLimit, extractClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { getSupportConfig } from '@/lib/support'
import { getMissingDeliveryFields } from '@/lib/money'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * POST /api/checkout/initialize -> { authorizationUrl: string, reference: string }
 *
 * Server-authoritative checkout initialization:
 *  1. Loads cart from DB and verifies active product & variant stock server-side.
 *  2. Computes subtotal, shipping (FLAT_SHIPPING_KOBO), and total strictly server-side.
 *  3. Creates pending Order + OrderItems with immutable price/name/size snapshots.
 *  4. Initializes Paystack transaction and returns { authorizationUrl, reference }.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser()
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`checkout:${user.id}:${ip}`, 10, 60)
    if (!limit.allowed) {
      return jsonError(
        429,
        'Too many checkout attempts. Please wait a moment and try again.',
        'RATE_LIMITED',
        rateLimitHeaders(limit),
      )
    }

    if (!isPaystackConfigured()) {
      return jsonError(
        503,
        'Paystack payments are not configured yet. Please set PAYSTACK_SECRET_KEY in your environment.',
        'PAYSTACK_NOT_CONFIGURED',
      )
    }

    const cart = await getCartResponse(user.id)
    if (cart.items.length === 0) {
      return jsonError(400, 'Your cart is empty.', 'EMPTY_CART')
    }

    const missingDelivery = getMissingDeliveryFields({
      phone: user.phone,
      address: user.address,
    })
    if (missingDelivery.length > 0) {
      return jsonError(
        400,
        `Please complete your delivery details in Profile (${missingDelivery.join(', ')}) before checking out.`,
        'DELIVERY_DETAILS_REQUIRED',
      )
    }

    // Re-validate stock against live DB variants
    const variantIds = cart.items.map((item) => item.variantId)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true, priceKobo: true, active: true } } },
    })
    const variantMap = new Map(variants.map((v) => [v.id, v]))

    const orderItemsData: Array<{
      variantId: string
      productNameSnap: string
      sizeSnap: string
      unitPriceKobo: number
      qty: number
    }> = []

    let subtotalKobo = 0

    for (const line of cart.items) {
      const variant = variantMap.get(line.variantId)
      if (!variant || !variant.product.active) {
        return jsonError(
          400,
          `${line.product.name} (${line.size}) is no longer available.`,
          'PRODUCT_UNAVAILABLE',
        )
      }
      if (variant.stockQty !== null) {
        if (variant.stockQty <= 0) {
          return jsonError(
            400,
            `${variant.product.name} (${variant.size}) is out of stock.`,
            'OUT_OF_STOCK',
          )
        }
        if (line.qty > variant.stockQty) {
          return jsonError(
            400,
            `Only ${variant.stockQty} left for ${variant.product.name} (${variant.size}).`,
            'INSUFFICIENT_STOCK',
          )
        }
      }

      const unitPriceKobo = variant.product.priceKobo
      subtotalKobo += unitPriceKobo * line.qty
      orderItemsData.push({
        variantId: variant.id,
        productNameSnap: variant.product.name,
        sizeSnap: variant.size,
        unitPriceKobo,
        qty: line.qty,
      })
    }

    const support = getSupportConfig()
    const shippingKobo = support.flatShippingKobo
    const totalKobo = subtotalKobo + shippingKobo

    if (totalKobo <= 0) {
      return jsonError(400, 'Order total must be greater than zero.', 'INVALID_TOTAL')
    }

    const reference = generateOrderReference('MK')
    const shippingAddress =
      user.address !== null && user.address !== undefined
        ? (user.address as Prisma.InputJsonValue)
        : Prisma.JsonNull

    const order = await prisma.order.create({
      data: {
        reference,
        userId: user.id,
        status: 'pending',
        subtotalKobo,
        shippingKobo,
        totalKobo,
        customerEmail: user.email,
        customerPhone: user.phone,
        shippingAddress,
        paystackRef: reference,
        items: {
          create: orderItemsData,
        },
      },
      select: { id: true, reference: true, totalKobo: true },
    })

    const callbackUrl = `${support.siteUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(order.reference)}/confirmation`

    try {
      const paystack = await initializePaystackTransaction({
        email: user.email,
        amountKobo: order.totalKobo,
        reference: order.reference,
        callbackUrl,
        metadata: {
          orderId: order.id,
          orderReference: order.reference,
          userId: user.id,
        },
      })

      return NextResponse.json({
        authorizationUrl: paystack.authorizationUrl,
        reference: order.reference,
      })
    } catch (paystackErr) {
      // Mark pending order failed if Paystack initialization failed
      await prisma.order
        .update({
          where: { id: order.id },
          data: { status: 'failed' },
        })
        .catch(() => {})

      const message =
        paystackErr instanceof Error
          ? paystackErr.message
          : 'Could not initialize payment with Paystack.'
      return jsonError(502, message, 'PAYSTACK_INIT_FAILED')
    }
  } catch (err) {
    return handleRouteError(err, 'checkout/initialize:POST')
  }
}
