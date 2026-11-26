import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { MarkdownContent } from '@/components/storefront/MarkdownContent'

export const dynamic = 'force-dynamic'

export default async function StoryPage() {
  const user = await requireUser('/story')

  const [page, cart] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'story' } }),
    getCartResponse(user.id),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell stories-page">
        <p className="page-kicker">Editorial / Archive</p>
        <div className="page-title-row">
          <h1>{page?.title ?? 'Our Story'}</h1>
          <span>Lagos Studio</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-12 sm:gap-12 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-5">
            <div className="story-visual h-[260px] !p-4 sm:h-[360px] sm:!p-6">
              <img
                src="/assets/hoodie-urban-legacy.jpg"
                alt="Maison Kriss Urban Legacy Hoodie"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="story-visual h-[140px] !p-3 sm:h-[180px] sm:!p-6">
                <img src="/assets/t-shirt-truth-seeker-v2.jpg" alt="Truth Seeker Tee" />
              </div>
              <div className="story-visual h-[140px] !p-3 sm:h-[180px] sm:!p-6">
                <img src="/assets/jorts-maison-kriss-product.jpg" alt="Maison Kriss Jorts" />
              </div>
            </div>
          </div>

          <div className="min-w-0 break-words [overflow-wrap:anywhere] lg:col-span-7">
            <MarkdownContent
              content={
                page?.content ??
                'Maison Kriss is an independent Nigerian contemporary clothing studio based in Lagos.'
              }
            />
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-6">
              <Link
                href="/"
                className="primary-action !mt-0 inline-flex min-h-[44px] items-center justify-center text-center"
              >
                Explore Collection
              </Link>
              <Link href="/contact" className="story-link inline-flex min-h-[44px] items-center">
                Contact Studio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
