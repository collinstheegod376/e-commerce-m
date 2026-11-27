import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { canonicalUrl } from '@/lib/seo'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { MarkdownContent } from '@/components/storefront/MarkdownContent'
import { Breadcrumbs } from '@/components/storefront/Breadcrumbs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Story — Maison Kriss Lagos Studio',
  description:
    'Discover the story behind Maison Kriss, an independent Nigerian contemporary clothing and object studio in Lagos crafting heavyweight garments in numbered runs.',
  alternates: {
    canonical: canonicalUrl('/story'),
  },
}

export default async function StoryPage() {
  const user = await getUser()

  const [page, cart] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'story' } }),
    user ? getCartResponse(user.id) : Promise.resolve({ items: [] }),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" width={1200} height={800} />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user?.role === 'admin'}
        userName={user?.name}
        isAuthenticated={Boolean(user)}
      />
      <section className="page-shell stories-page">
        <Breadcrumbs
          items={[
            { label: 'Maison Kriss', href: '/story' },
            { label: 'Our Story', href: '/story' },
          ].slice(1)}
        />
        <p className="page-kicker">Editorial / Archive</p>
        <div className="page-title-row">
          <h1>{page?.title ?? 'Our Story'}</h1>
          <span>Lagos Studio</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-12 sm:gap-12 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-5">
            <div className="story-visual h-[260px] !p-4 sm:h-[360px] sm:!p-6">
              <Image
                src="/assets/hoodie-urban-legacy.jpg"
                alt="Maison Kriss Urban Legacy Hoodie"
                width={800}
                height={800}
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="story-visual h-[140px] !p-3 sm:h-[180px] sm:!p-6">
                <Image
                  src="/assets/t-shirt-truth-seeker-v2.jpg"
                  alt="Truth Seeker Tee"
                  width={600}
                  height={600}
                  sizes="(max-width: 1024px) 50vw, 20vw"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="story-visual h-[140px] !p-3 sm:h-[180px] sm:!p-6">
                <Image
                  src="/assets/jorts-maison-kriss-product.jpg"
                  alt="Maison Kriss Jorts"
                  width={600}
                  height={600}
                  sizes="(max-width: 1024px) 50vw, 20vw"
                  className="h-full w-full object-contain"
                />
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
                href={user ? '/' : '/login'}
                className="primary-action !mt-0 inline-flex min-h-[44px] items-center justify-center text-center"
              >
                {user ? 'Explore Collection' : 'Member Sign In'}
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
