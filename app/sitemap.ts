import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { canonicalUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicSlugs = ['story', 'contact'] as const
  let updatedBySlug = new Map<string, Date>()

  try {
    const pages = await prisma.page.findMany({
      where: { slug: { in: [...publicSlugs] } },
      select: { slug: true, updatedAt: true },
    })
    updatedBySlug = new Map(pages.map((p) => [p.slug, p.updatedAt]))
  } catch {
    // Do not fake lastModified dates if database is unreachable
  }

  return publicSlugs.map((slug) => {
    const updatedAt = updatedBySlug.get(slug)
    return {
      url: canonicalUrl(`/${slug}`),
      ...(updatedAt ? { lastModified: updatedAt } : {}),
    }
  })
}
