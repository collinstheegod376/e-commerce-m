import type { Metadata } from 'next'
import Link from 'next/link'
import { NOINDEX_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Page Not Found — Maison Kriss',
  description: 'The requested page could not be found on Maison Kriss.',
  robots: NOINDEX_ROBOTS,
}

export default function NotFound() {
  return (
    <main className="storefront flex min-h-screen items-center justify-center px-4 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-white/12 border-t-2 border-t-[#ff660c] bg-[#041b26] p-8 text-center shadow-2xl sm:p-12">
        <p className="page-kicker">Error 404</p>
        <h1 className="mt-3 font-brush text-4xl uppercase tracking-[0.03em] text-[#f8fafc] sm:text-5xl">
          Page Not Found
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/story"
            className="primary-action !mt-0 inline-flex min-h-[44px] items-center justify-center"
          >
            Read Our Story
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
          >
            Contact Studio
          </Link>
        </div>
      </section>
    </main>
  )
}
