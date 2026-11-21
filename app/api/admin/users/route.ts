import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { handleRouteError } from '@/lib/http'

const PAGE_SIZE = 25

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin()

    const params = request.nextUrl.searchParams
    const q = params.get('q')?.trim() || ''
    const pageRaw = Number(params.get('page') ?? '1')
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

    const where: Prisma.ProfileWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          _count: { select: { orders: true } },
          orders: {
            where: { status: { in: ['paid', 'fulfilled'] } },
            select: { totalKobo: true },
          },
        },
      }),
      prisma.profile.count({ where }),
    ])

    const users = profiles.map((p) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone,
      role: p.role,
      createdAt: p.createdAt,
      ordersCount: p._count.orders,
      totalSpentKobo: p.orders.reduce((sum, o) => sum + o.totalKobo, 0),
    }))

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    })
  } catch (err) {
    return handleRouteError(err, 'admin/users:GET')
  }
}
