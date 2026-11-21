import { NextResponse, type NextRequest } from 'next/server'
import { verifyPaystackSignature } from '@/lib/paystack'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * POST /api/paystack/webhook -> 200 (idempotent)
 *
 * TODO(HANDOFF-TO-AGENT-4): Complete Paystack webhook processing:
 *  1. Signature verification below already uses timingSafeEqual on raw body.
 *  2. Insert PaymentEvent with unique paystackEventId for idempotency.
 *  3. Verify Paystack amount/currency matches Order.totalKobo server-side.
 *  4. In a Prisma transaction: transition Order to 'paid', set paidAt & paystackRef,
 *     decrement ProductVariant.stockQty (where non-null), and clear user's Cart.
 *  5. Call notifier.notifyPaidOrder(order) + emails.sendReceipt(order) (Agent 5),
 *     or notifier.notifyFailedOrder(order) on failed events.
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

    console.info(
      JSON.stringify({
        event: 'paystack.webhook.stub_received',
        bytes: rawBody.length,
      }),
    )

    return NextResponse.json(
      {
        error:
          'Paystack webhook handler is stubbed pending Agent 4 handoff (TODO(HANDOFF-TO-AGENT-4)).',
        code: 'AGENT_4_STUB',
      },
      { status: 501 },
    )
  } catch (err) {
    return handleRouteError(err, 'paystack/webhook:POST')
  }
}
