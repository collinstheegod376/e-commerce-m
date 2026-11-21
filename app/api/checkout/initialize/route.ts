import { NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { handleRouteError, jsonError } from '@/lib/http'

/**
 * POST /api/checkout/initialize -> { authorizationUrl: string, reference: string }
 *
 * TODO(HANDOFF-TO-AGENT-4): Implement full Paystack transaction initialization:
 *  1. Read cart via getCartResponse(user.id) and recompute subtotal/shipping/total server-side.
 *  2. Verify stock for each variant; never trust client-sent amounts.
 *  3. Create pending Order + OrderItems (with productNameSnap, sizeSnap, unitPriceKobo) transactionally.
 *  4. Call POST https://api.paystack.co/transaction/initialize and return { authorizationUrl, reference }.
 */
export async function POST() {
  try {
    const user = await requireApiUser()
    const cart = await getCartResponse(user.id)

    if (cart.items.length === 0) {
      return jsonError(400, 'Your cart is empty.', 'EMPTY_CART')
    }

    console.info(
      JSON.stringify({
        event: 'checkout.initialize.stub',
        userId: user.id,
        itemCount: cart.items.length,
        subtotalKobo: cart.subtotalKobo,
      }),
    )

    return NextResponse.json(
      {
        error:
          'Paystack checkout initialization is stubbed pending Agent 4 handoff (TODO(HANDOFF-TO-AGENT-4)).',
        code: 'AGENT_4_STUB',
      },
      { status: 501 },
    )
  } catch (err) {
    return handleRouteError(err, 'checkout/initialize:POST')
  }
}
