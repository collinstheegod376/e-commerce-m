export default function CartLoading() {
  return (
    <main
      className="storefront inner-page"
      aria-busy="true"
      aria-label="Loading shopping cart"
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
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
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

      {/* Cart Content Skeleton */}
      <section className="page-shell cart-page">
        <p className="page-kicker">Your selection</p>
        <div className="page-title-row">
          <div className="h-10 w-28 rounded bg-white/20 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-white/10 animate-pulse" />
        </div>

        <div className="cart-layout animate-pulse">
          {/* Cart Items List */}
          <div className="cart-list min-w-0 space-y-6">
            {[...Array(2)].map((_, i) => (
              <article key={i} className="cart-row">
                {/* Product Thumbnail Mockup */}
                <div className="product-mark hoodie-mark flex items-center justify-center rounded bg-white/5 border border-white/10">
                  <span className="font-display text-2xl font-bold uppercase tracking-widest text-white/10">
                    MK
                  </span>
                </div>

                {/* Item Details */}
                <div className="cart-info min-w-0 space-y-2">
                  <div className="h-3 w-28 rounded bg-white/15" />
                  <div className="h-6 w-3/4 rounded bg-white/20" />
                  <div className="h-4 w-44 rounded bg-white/10" />
                  <div className="h-3 w-16 rounded bg-white/5" />
                </div>

                {/* Stepper + Total Price */}
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1 sm:contents">
                  <div className="h-9 w-28 rounded border border-white/10 bg-white/5" />
                  <div className="h-5 w-24 rounded bg-[#ff660c]/40" />
                </div>
              </article>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="order-summary w-full min-w-0 !p-5 sm:!p-8 space-y-4">
            <p>Order summary</p>
            <div className="flex justify-between py-4 border-b border-white/10">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="h-4 w-24 rounded bg-white/20" />
            </div>
            <div className="flex justify-between py-4 border-b border-white/10">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="h-4 w-32 rounded bg-white/15" />
            </div>
            <div className="summary-total flex justify-between py-5 !border-b-0">
              <div className="h-5 w-32 rounded bg-white/15" />
              <div className="h-5 w-28 rounded bg-[#ff660c]/50" />
            </div>

            {/* Delivery Details Skeleton Box */}
            <div className="checkout-client-box min-w-0 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-white/20" />
                <div className="h-3 w-16 rounded bg-[#ff660c]/40" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-4 w-36 rounded bg-white/20" />
                <div className="h-3 w-28 rounded bg-white/10" />
                <div className="h-3 w-48 rounded bg-white/10" />
              </div>
            </div>

            {/* Checkout Action Button Skeleton */}
            <div className="flex h-12 w-full items-center justify-center rounded bg-[#ff660c]/40">
              <div className="h-4 w-36 rounded bg-white/40" />
            </div>
            <div className="mx-auto h-3 w-56 rounded bg-white/10" />
          </aside>
        </div>
      </section>
    </main>
  )
}
