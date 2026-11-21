import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type RevenueRange = '7d' | '30d' | '90d' | 'all'

export interface OverviewStats {
  revenue: number // kobo
  orders: number // paid + fulfilled count
  users: number
  aov: number // average order value in kobo
  successRate: number // 0..100 percentage
}

export interface RevenuePoint {
  date: string
  revenueKobo: number
  orders: number
}

export interface TopProductStat {
  productId: string
  name: string
  qtySold: number
  revenueKobo: number
}

export interface SizeStat {
  size: string
  qtySold: number
}

export interface PaymentOutcomeStats {
  paid: number
  failed: number
  abandoned: number
  pending: number
}

export interface LowStockAlert {
  variantId: string
  productId: string
  productName: string
  productSlug: string
  size: string
  sku: string | null
  stockQty: number
}

export function parseRevenueRange(raw: string | null | undefined): RevenueRange {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') return raw
  return '30d'
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [orderAggRows, userCount] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        paid_revenue: bigint | number | null
        paid_orders: bigint | number | null
        settled_attempts: bigint | number | null
      }>
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('paid', 'fulfilled') THEN total_kobo ELSE 0 END), 0) AS paid_revenue,
        COUNT(*) FILTER (WHERE status IN ('paid', 'fulfilled')) AS paid_orders,
        COUNT(*) FILTER (WHERE status IN ('paid', 'fulfilled', 'failed', 'abandoned')) AS settled_attempts
      FROM orders
    `),
    prisma.profile.count(),
  ])

  const row = orderAggRows[0]
  const revenue = Number(row?.paid_revenue ?? 0)
  const orders = Number(row?.paid_orders ?? 0)
  const settledAttempts = Number(row?.settled_attempts ?? 0)
  const aov = orders > 0 ? Math.round(revenue / orders) : 0
  const successRate =
    settledAttempts > 0 ? Math.round((orders / settledAttempts) * 1000) / 10 : 0

  return {
    revenue,
    orders,
    users: userCount,
    aov,
    successRate,
  }
}

export async function getRevenueSeries(range: RevenueRange): Promise<RevenuePoint[]> {
  const daysMap: Record<Exclude<RevenueRange, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }

  let rows: Array<{ day: Date; revenue: bigint | number | null; orders: bigint | number | null }>

  if (range === 'all') {
    rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        date_trunc('day', COALESCE(paid_at, created_at)) AS day,
        COALESCE(SUM(total_kobo), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE status IN ('paid', 'fulfilled')
      GROUP BY 1
      ORDER BY 1 ASC
    `)
  } else {
    const cutoff = new Date(Date.now() - daysMap[range] * 24 * 60 * 60 * 1000)
    rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        date_trunc('day', COALESCE(paid_at, created_at)) AS day,
        COALESCE(SUM(total_kobo), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE status IN ('paid', 'fulfilled')
        AND COALESCE(paid_at, created_at) >= ${cutoff}
      GROUP BY 1
      ORDER BY 1 ASC
    `)
  }

  return rows.map((r) => ({
    date: new Date(r.day).toISOString().slice(0, 10),
    revenueKobo: Number(r.revenue ?? 0),
    orders: Number(r.orders ?? 0),
  }))
}

export async function getTopProducts(limit = 10): Promise<TopProductStat[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      product_id: string
      name: string
      qty_sold: bigint | number | null
      revenue: bigint | number | null
    }>
  >(Prisma.sql`
    SELECT
      p.id AS product_id,
      p.name AS name,
      COALESCE(SUM(oi.qty), 0) AS qty_sold,
      COALESCE(SUM(oi.qty * oi.unit_price_kobo), 0) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN product_variants v ON v.id = oi.variant_id
    JOIN products p ON p.id = v.product_id
    WHERE o.status IN ('paid', 'fulfilled')
    GROUP BY p.id, p.name
    ORDER BY qty_sold DESC
    LIMIT ${limit}
  `)

  return rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    qtySold: Number(r.qty_sold ?? 0),
    revenueKobo: Number(r.revenue ?? 0),
  }))
}

export async function getSizeDistribution(): Promise<SizeStat[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      size_snap: string
      qty: bigint | number | null
    }>
  >(Prisma.sql`
    SELECT
      oi.size_snap,
      COALESCE(SUM(oi.qty), 0) AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'fulfilled')
    GROUP BY 1
    ORDER BY qty DESC
  `)

  return rows.map((r) => ({
    size: r.size_snap,
    qtySold: Number(r.qty ?? 0),
  }))
}

export async function getPaymentOutcomes(): Promise<PaymentOutcomeStats> {
  const rows = await prisma.$queryRaw<
    Array<{ status: string; count: bigint | number }>
  >(Prisma.sql`
    SELECT status, COUNT(*) AS count
    FROM orders
    GROUP BY status
  `)

  const counts: PaymentOutcomeStats = {
    paid: 0,
    failed: 0,
    abandoned: 0,
    pending: 0,
  }

  for (const row of rows) {
    const n = Number(row.count ?? 0)
    if (row.status === 'paid' || row.status === 'fulfilled') {
      counts.paid += n
    } else if (row.status === 'failed') {
      counts.failed += n
    } else if (row.status === 'abandoned') {
      counts.abandoned += n
    } else if (row.status === 'pending') {
      counts.pending += n
    }
  }

  return counts
}

export async function getLowStockAlerts(threshold = 5): Promise<LowStockAlert[]> {
  const variants = await prisma.productVariant.findMany({
    where: {
      stockQty: { not: null, lt: threshold },
      product: { active: true },
    },
    orderBy: [{ stockQty: 'asc' }, { size: 'asc' }],
    take: 50,
    include: {
      product: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  return variants.map((v) => ({
    variantId: v.id,
    productId: v.product.id,
    productName: v.product.name,
    productSlug: v.product.slug,
    size: v.size,
    sku: v.sku,
    stockQty: v.stockQty ?? 0,
  }))
}

export async function getRecentOrders(limit = 10) {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  })
}
