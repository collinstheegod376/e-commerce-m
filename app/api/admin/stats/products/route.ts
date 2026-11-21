import { NextResponse } from 'next/server'
import { requireApiAdmin } from '@/lib/auth'
import { getTopProducts } from '@/lib/admin-analytics'
import { handleRouteError } from '@/lib/http'

export async function GET() {
  try {
    await requireApiAdmin()
    const products = await getTopProducts(10)
    return NextResponse.json(products)
  } catch (err) {
    return handleRouteError(err, 'admin/stats/products:GET')
  }
}
