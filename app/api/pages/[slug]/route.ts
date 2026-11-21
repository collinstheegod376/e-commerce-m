import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleRouteError, jsonError } from '@/lib/http'

const ALLOWED_SLUGS = new Set(['story', 'contact'])

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params
    if (!ALLOWED_SLUGS.has(slug)) {
      return jsonError(404, 'Page not found.', 'NOT_FOUND')
    }

    const page = await prisma.page.findUnique({ where: { slug } })
    if (!page) {
      return jsonError(404, 'Page not found.', 'NOT_FOUND')
    }

    return NextResponse.json({
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt,
    })
  } catch (err) {
    return handleRouteError(err, 'pages/[slug]:GET')
  }
}
