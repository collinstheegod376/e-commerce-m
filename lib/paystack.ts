import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Constant-time HMAC-SHA512 Paystack webhook signature verification helper.
 * Used by Agent 4's webhook handler (/api/paystack/webhook).
 */
export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signatureHeader) return false

  const expectedHex = createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex')
  const expectedBuf = Buffer.from(expectedHex, 'utf8')
  const receivedBuf = Buffer.from(signatureHeader.trim(), 'utf8')

  if (expectedBuf.length !== receivedBuf.length) {
    return false
  }
  return timingSafeEqual(expectedBuf, receivedBuf)
}

export interface PaystackRefundResult {
  ok: boolean
  refundReference?: string
  message: string
}

/**
 * TODO(HANDOFF-TO-AGENT-4): Implement real POST https://api.paystack.co/refund call.
 * Consumed by Agent 6's admin order detail refund action (PATCH /api/admin/orders/[id] {status:'refunded'}).
 */
export async function issuePaystackRefund(
  paystackReference: string,
  amountKobo?: number,
): Promise<PaystackRefundResult> {
  console.info(
    JSON.stringify({
      event: 'paystack.refund.stub',
      paystackReference,
      amountKobo: amountKobo ?? null,
      note: 'TODO(HANDOFF-TO-AGENT-4): wire live Paystack /refund API call',
    }),
  )

  return {
    ok: false,
    message:
      'Paystack refund API integration is stubbed pending Agent 4 handoff (TODO(HANDOFF-TO-AGENT-4)).',
  }
}
