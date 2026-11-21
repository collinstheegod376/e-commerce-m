import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { ApiError, handleRouteError } from '@/lib/http'

const patchUserSchema = z.object({
  role: z.enum(['customer', 'admin']),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiAdmin()
    const { id } = await context.params

    const user = await prisma.profile.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            _count: { select: { items: true } },
          },
        },
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found.', 'NOT_FOUND')
    }

    const totalSpentKobo = user.orders
      .filter((o) => o.status === 'paid' || o.status === 'fulfilled')
      .reduce((sum, o) => sum + o.totalKobo, 0)

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt,
        totalSpentKobo,
      },
      orders: user.orders,
    })
  } catch (err) {
    return handleRouteError(err, 'admin/users/[id]:GET')
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireApiAdmin()
    const { id } = await context.params
    const body = patchUserSchema.parse(await request.json())

    // Hard constraint: never allow an admin to demote themselves (prevent lockout)
    if (id === admin.id && body.role !== 'admin') {
      throw new ApiError(
        400,
        'You cannot demote your own admin account.',
        'SELF_DEMOTION_FORBIDDEN',
      )
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: { role: body.role },
    })

    console.info(
      JSON.stringify({
        event: 'admin.user.role_updated',
        targetUserId: updated.id,
        targetEmail: updated.email,
        newRole: updated.role,
        actorAdminId: admin.id,
      }),
    )

    return NextResponse.json({
      profile: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
        address: updated.address,
        createdAt: updated.createdAt,
      },
    })
  } catch (err) {
    return handleRouteError(err, 'admin/users/[id]:PATCH')
  }
}
