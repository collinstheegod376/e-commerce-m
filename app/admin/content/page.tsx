import { prisma } from '@/lib/prisma'
import { ContentEditorsClient } from '@/components/admin/ContentEditorsClient'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  const [storyPage, contactPage] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'story' } }),
    prisma.page.findUnique({ where: { slug: 'contact' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Editorial CMS
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Content Pages</h1>
        <p className="mt-1 text-xs text-[#6a6a6a]">
          Edit markdown rendered on <code>/story</code> and <code>/contact</code>.
        </p>
      </div>

      <ContentEditorsClient
        story={{
          slug: 'story',
          title: storyPage?.title ?? 'Our Story',
          content: storyPage?.content ?? '',
          updatedAt: storyPage?.updatedAt.toISOString() ?? null,
        }}
        contact={{
          slug: 'contact',
          title: contactPage?.title ?? 'Contact',
          content: contactPage?.content ?? '',
          updatedAt: contactPage?.updatedAt.toISOString() ?? null,
        }}
      />
    </div>
  )
}
