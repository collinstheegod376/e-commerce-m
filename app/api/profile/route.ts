import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiUser } from '@/lib/auth'
import { handleRouteError } from '@/lib/http'

const addressSchema = z
  .object({
    username: z.string().trim().max(80).optional(),
    altPhone: z.string().trim().max(40).optional(),
    streetAddress: z.string().trim().max(240).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(40).optional(),
    country: z.string().trim().max(100).optional(),
    deliveryNotes: z.string().trim().max(300).optional(),
  })
  .strict()

const patchProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address: addressSchema.nullable().optional(),
})

export async function GET() {
  try {
    const profile = await requireApiUser()

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      address: profile.address,
      createdAt: profile.createdAt,
    })
  } catch (err) {
    return handleRouteError(err, 'profile:GET')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await requireApiUser()
    const body = patchProfileSchema.parse(await request.json())

    // Strictly scoped to the authenticated user's own profile; role is never writable here.
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.address !== undefined
          ? { address: body.address === null ? Prisma.JsonNull : body.address }
          : {}),
      },
    })

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      address: updated.address,
      createdAt: updated.createdAt,
    })
  } catch (err) {
    return handleRouteError(err, 'profile:PATCH')
  }
}
