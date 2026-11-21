import { NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    const user = await requireApiUser()
    const cart = await getCartResponse(user.id)
    return NextResponse.json(cart)
  } catch (err) {
    return handleRouteError(err, 'cart:GET')
  }
}
