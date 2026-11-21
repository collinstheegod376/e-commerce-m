import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { handleRouteError } from '@/lib/http'

const PAGE_SIZE = 25
const ALLOWED_STATUSES = new Set([
  'pending',
  'paid',
  'failed',
  'abandoned',
  'fulfilled',
  'cancelled',
  'refunded',
])

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin()

    const params = request.nextUrl.searchParams
    const statusParam = params.get('status')?.trim() || ''
    const q = params.get('q')?.trim() || ''
    const pageRaw = Number(params.get('page') ?? '1')
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

    const where: Prisma.OrderWhereInput = {}
    if (statusParam && ALLOWED_STATUSES.has(statusParam)) {
      where.status = statusParam
    }
    if (q) {
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    })
  } catch (err) {
    return handleRouteError(err, 'admin/orders:GET')
  }
}
