import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { buildPaymentFailureSupportLinks, getSupportConfig } from '@/lib/support'
import { canonicalUrl } from '@/lib/seo'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { MarkdownContent } from '@/components/storefront/MarkdownContent'
import { Breadcrumbs } from '@/components/storefront/Breadcrumbs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact & Client Services — Maison Kriss Lagos',
  description:
    'Contact Maison Kriss Client Services in Lagos via WhatsApp, email, or studio phone for sizing, dispatch, delivery, and order support.',
  alternates: {
    canonical: canonicalUrl('/contact'),
  },
}

export default async function ContactPage() {
  const user = await getUser()

  const [page, cart] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'contact' } }),
    user ? getCartResponse(user.id) : Promise.resolve({ items: [] }),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)
  const support = getSupportConfig()
  const links = buildPaymentFailureSupportLinks(undefined, support)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" width={1200} height={800} />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user?.role === 'admin'}
        userName={user?.name}
        isAuthenticated={Boolean(user)}
      />
      <section className="page-shell">
        <Breadcrumbs
          items={[
            { label: 'Our Story', href: '/story' },
            { label: 'Contact', href: '/contact' },
          ]}
        />
        <p className="page-kicker">Client Services / Lagos</p>
        <div className="page-title-row">
          <h1>{page?.title ?? 'Contact'}</h1>
          <span>Direct Concierge</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-12 sm:gap-12 lg:grid-cols-12">
          <div className="min-w-0 break-words [overflow-wrap:anywhere] lg:col-span-7">
            <MarkdownContent
              content={
                page?.content ??
                'Reach Maison Kriss Client Services using the verified channels on this page.'
              }
            />
          </div>

          <aside className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-[#ff660c]/30 bg-[#041b26] p-5 text-[#f8fafc] shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff660c]">
                Direct Support Channels
              </p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
                Need assistance with an order?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Contact our studio team directly via WhatsApp, email, or phone.
              </p>

              <div className="mt-6 space-y-3.5 sm:mt-8 sm:space-y-4">
                <a
                  href={links.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#01121a] px-4 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c] sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      WhatsApp Concierge
                    </div>
                    <div className="mt-1 break-words font-semibold text-white">
                      {support.whatsapp}
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
                    Message →
                  </span>
                </a>

                <a
                  href={`mailto:${support.email}`}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#01121a] px-4 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c] sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Email Support
                    </div>
                    <div className="mt-1 break-all font-semibold text-white sm:break-words">
                      {support.email}
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
                    Email →
                  </span>
                </a>

                <a
                  href={links.telUrl}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#01121a] px-4 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c] sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Studio Phone
                    </div>
                    <div className="mt-1 break-words font-semibold text-white">
                      {support.phone}
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
                    Call →
                  </span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
