import { NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth'
import { getOverviewStats } from '@/lib/admin-analytics'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    await requireApiAdmin()
    const stats = await getOverviewStats()
    return NextResponse.json(stats)
  } catch (err) {
    return handleRouteError(err, 'admin/stats/overview:GET')
  }
}
