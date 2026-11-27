export default function ProductDetailLoading() {
  return (
    <main
      className="storefront inner-page"
      aria-busy="true"
      aria-label="Loading product details"
    >
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />

      {/* Storefront Header Placeholder with Zero Layout Shift */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#01121a]/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
          {/* Brand Wordmark + Geometric MK Monogram */}
          <div className="inline-flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#ff660c]/60 bg-[#ff660c]/10 text-[#ff660c] sm:h-9 sm:w-9"
            >
              <svg
                viewBox="0 0 32 32"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 23.5V8.5L10.5 16.5L16.5 8.5V23.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
                <path
                  d="M20.5 8.5V23.5M27.5 8.5L21 16L27.5 23.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </span>
            <span className="font-display whitespace-nowrap text-sm font-bold uppercase tracking-[0.12em] text-[#ff660c] sm:text-xl sm:tracking-[0.18em]">
              Maison Kriss
            </span>
          </div>

          {/* Desktop Navigation Mockup */}
          <nav
            aria-label="Primary navigation skeleton"
            className="hidden items-center gap-8 md:flex lg:gap-10"
          >
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#ff660c]">
              Products
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Story
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Contact
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Account
            </span>
          </nav>

          {/* Right Action Icons Skeleton */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3.5">
            <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5" />
            <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5" />
          </div>
        </div>
      </header>

      {/* Main Product Detail Editorial Skeleton */}
      <section className="page-shell">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 animate-pulse">
          {/* Left Column: Visual Media & Gallery Strip */}
          <div className="min-w-0 lg:col-span-7">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/12 bg-[#041b26]/90 p-4 sm:p-8 flex items-center justify-center">
              {/* Subtle Monogram Watermark */}
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-white/5 bg-white/[0.02]">
                <span className="font-display text-4xl font-extrabold uppercase tracking-widest text-white/10">
                  MK
                </span>
              </div>

              {/* Angle Pill Placeholder */}
              <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#01121a]/85 px-2.5 py-1 text-[10px] sm:left-3 sm:top-3 sm:px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" />
                <div className="h-2.5 w-16 rounded bg-white/20" />
              </div>

              {/* Inspect Piece Placeholder */}
              <div className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-[#ff660c]/30 bg-[#01121a]/90 px-2.5 py-1 sm:right-3 sm:top-3 sm:px-3.5 sm:py-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff660c]/50" />
                <div className="h-2.5 w-14 rounded bg-white/20" />
              </div>
            </div>

            {/* Thumbnail Strip Skeleton */}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-white/15" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
              <div className="flex items-center gap-2.5">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-20 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-[#041b26] p-1"
                  >
                    <div className="h-12 w-full rounded-lg bg-white/5" />
                    <div className="h-2 w-8 rounded bg-white/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Editorial Pricing & Sizing Controls */}
          <div className="flex min-w-0 flex-col lg:col-span-5 space-y-4">
            <div className="h-3 w-28 rounded bg-[#ff660c]/40" />
            <div className="h-12 sm:h-16 w-4/5 rounded bg-white/20" />
            <div className="h-8 w-36 rounded bg-[#ff660c]/50" />

            {/* Description lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
            </div>

            {/* Selection & Checkout Controls Card */}
            <div className="mt-6 space-y-6 rounded-2xl border border-white/12 bg-[#041b26]/90 p-4 sm:p-6">
              <div>
                <div className="mb-3 h-3 w-20 rounded bg-slate-400/40" />
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <div
                      key={size}
                      className="flex h-10 w-12 items-center justify-center rounded-lg border border-white/15 bg-white/5"
                    >
                      <span className="text-xs font-semibold text-white/30">{size}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 h-3 w-16 rounded bg-slate-400/40" />
                <div className="h-11 w-32 rounded-lg border border-white/15 bg-white/5" />
              </div>

              <div className="flex h-14 w-full items-center justify-center rounded-lg border border-[#ff660c]/40 bg-[#ff660c]/30">
                <div className="h-4 w-32 rounded bg-white/40" />
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff660c]/50" />
                  <div className="h-3 w-48 rounded bg-white/15" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff660c]/50" />
                  <div className="h-3 w-40 rounded bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
