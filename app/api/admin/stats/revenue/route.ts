import { NextResponse, type NextRequest } from 'next/server'
import { requireApiAdmin } from '@/lib/auth'
import { getRevenueSeries, parseRevenueRange } from '@/lib/admin-analytics'
import { handleRouteError } from '@/lib/http'

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin()
    const range = parseRevenueRange(request.nextUrl.searchParams.get('range'))
    const series = await getRevenueSeries(range)
    return NextResponse.json(series)
  } catch (err) {
    return handleRouteError(err, 'admin/stats/revenue:GET')
  }
}
