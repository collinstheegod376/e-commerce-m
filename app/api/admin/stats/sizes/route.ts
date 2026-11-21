import { NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth'
import { getSizeDistribution } from '@/lib/admin-analytics'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    await requireApiAdmin()
    const sizes = await getSizeDistribution()
    return NextResponse.json(sizes)
  } catch (err) {
    return handleRouteError(err, 'admin/stats/sizes:GET')
  }
}
