import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { ApiError, handleRouteError } from '@/lib/http'

const ALLOWED_SLUGS = new Set(['story', 'contact'])

const patchPageSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  content: z.string().min(1, 'Content is required').max(50000),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await requireApiAdmin()
    const { slug } = await context.params

    if (!ALLOWED_SLUGS.has(slug)) {
      throw new ApiError(404, 'Unsupported page slug.', 'NOT_FOUND')
    }

    const page = await prisma.page.findUnique({ where: { slug } })
    if (!page) {
      return NextResponse.json({
        page: {
          slug,
          title: slug === 'story' ? 'Our Story' : 'Contact',
          content: '',
          updatedAt: null,
        },
      })
    }

    return NextResponse.json({ page })
  } catch (err) {
    return handleRouteError(err, 'admin/pages/[slug]:GET')
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await requireApiAdmin()
    const { slug } = await context.params

    if (!ALLOWED_SLUGS.has(slug)) {
      throw new ApiError(404, 'Unsupported page slug.', 'NOT_FOUND')
    }

    const body = patchPageSchema.parse(await request.json())

    const page = await prisma.page.upsert({
      where: { slug },
      update: { title: body.title, content: body.content },
      create: { slug, title: body.title, content: body.content },
    })

    return NextResponse.json({ page })
  } catch (err) {
    return handleRouteError(err, 'admin/pages/[slug]:PATCH')
  }
}
