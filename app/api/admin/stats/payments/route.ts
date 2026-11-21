import { NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth'
import { getPaymentOutcomes } from '@/lib/admin-analytics'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    await requireApiAdmin()
    const payments = await getPaymentOutcomes()
    return NextResponse.json(payments)
  } catch (err) {
    return handleRouteError(err, 'admin/stats/payments:GET')
  }
}
