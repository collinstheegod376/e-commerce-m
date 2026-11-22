import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { buildPaymentFailureSupportLinks, getSupportConfig } from '@/lib/support'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { MarkdownContent } from '@/components/storefront/MarkdownContent'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const user = await requireUser('/contact')

  const [page, cart] = await Promise.all([
    prisma.page.findUnique({ where: { slug: 'contact' } }),
    getCartResponse(user.id),
  ])

  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)
  const support = getSupportConfig()
  const links = buildPaymentFailureSupportLinks(undefined, support)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell">
        <p className="page-kicker">Client Services / Lagos</p>
        <div className="page-title-row">
          <h1>{page?.title ?? 'Contact'}</h1>
          <span>Direct Concierge</span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MarkdownContent
              content={
                page?.content ??
                'Reach Maison Kriss Client Services using the verified channels on this page.'
              }
            />
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-[#ff660c]/30 bg-[#041b26] p-8 text-[#f8fafc] shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff660c]">
                Direct Support Channels
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-white">
                Need assistance with an order?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Contact our studio team directly via WhatsApp, email, or phone.
              </p>

              <div className="mt-8 space-y-4">
                <a
                  href={links.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/15 bg-[#01121a] px-5 py-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c]"
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      WhatsApp Concierge
                    </div>
                    <div className="mt-1 font-semibold text-white">{support.whatsapp}</div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
                    Message →
                  </span>
                </a>

                <a
                  href={`mailto:${support.email}`}
                  className="flex items-center justify-between rounded-xl border border-white/15 bg-[#01121a] px-5 py-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c]"
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Email Support
                    </div>
                    <div className="mt-1 font-semibold text-white">{support.email}</div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
                    Email →
                  </span>
                </a>

                <a
                  href={links.telUrl}
                  className="flex items-center justify-between rounded-xl border border-white/15 bg-[#01121a] px-5 py-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c]"
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Studio Phone
                    </div>
                    <div className="mt-1 font-semibold text-white">{support.phone}</div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff660c]">
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
