'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Menu, Shield, ShoppingBag, User, X } from 'lucide-react'

interface StorefrontHeaderProps {
  initialCartCount: number
  isAdmin: boolean
  userName?: string | null
}

function MkMonogramBadge() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#ff660c]/60 bg-[#ff660c]/10 text-[#ff660c] transition-all duration-300 group-hover:border-[#ff660c] group-hover:bg-[#ff660c] group-hover:text-[#01121a] sm:h-9 sm:w-9"
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
  )
}

export function StorefrontHeader({
  initialCartCount,
  isAdmin,
  userName,
}: StorefrontHeaderProps) {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(initialCartCount)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setCartCount(initialCartCount)
  }, [initialCartCount])

  useEffect(() => {
    function onCartUpdated(event: Event) {
      const custom = event as CustomEvent<{ count?: number }>
      if (typeof custom.detail?.count === 'number') {
        setCartCount(custom.detail.count)
      }
    }
    window.addEventListener('mk:cart-updated', onCartUpdated)
    return () => window.removeEventListener('mk:cart-updated', onCartUpdated)
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Lock body scroll, close on Escape, and reset when expanding to desktop
  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    function onResize() {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [mobileMenuOpen])

  const firstName = userName?.trim().split(/\s+/)[0] || null

  const navItems = [
    {
      label: 'Products',
      href: '/',
      active: pathname === '/' || pathname.startsWith('/products'),
    },
    {
      label: 'Story',
      href: '/story',
      active: pathname === '/story' || pathname.startsWith('/story/'),
    },
    {
      label: 'Contact',
      href: '/contact',
      active: pathname === '/contact',
    },
    {
      label: 'Account',
      href: '/profile',
      active: pathname === '/profile',
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            href: '/admin',
            active: pathname === '/admin' || pathname.startsWith('/admin/'),
            isAdminLink: true,
          },
        ]
      : []),
  ]

  const mobileNavItems = [
    ...navItems.slice(0, 4),
    {
      label: 'Cart',
      href: '/cart',
      active: pathname === '/cart',
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            href: '/admin',
            active: pathname === '/admin' || pathname.startsWith('/admin/'),
            isAdminLink: true,
          },
        ]
      : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#01121a]/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
          {/* Left — Brand Wordmark + Geometric MK Monogram */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group inline-flex min-w-0 shrink items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff660c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#01121a] sm:gap-3"
          >
            <MkMonogramBadge />
            <span className="font-display whitespace-nowrap text-sm font-bold uppercase tracking-[0.12em] text-[#ff660c] transition-colors duration-300 group-hover:text-white sm:text-xl sm:tracking-[0.18em]">
              Maison Kriss
            </span>
          </Link>

          {/* Center — Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-8 md:flex lg:gap-10"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-1.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#ff660c] after:transition-all after:duration-300 after:content-[''] ${
                  item.active
                    ? 'text-[#ff660c] after:w-full'
                    : item.isAdminLink
                      ? 'text-[#ff7a2e] hover:text-white after:w-0 hover:after:w-full'
                      : 'text-slate-300 hover:text-[#ff660c] after:w-0 hover:after:w-full'
                }`}
              >
                {item.isAdminLink ? <Shield className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right — Actions + Mobile Hamburger Trigger */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3.5">
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={`Cart with ${cartCount} items`}
              className={`group relative inline-flex h-9 w-9 items-center justify-center border transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c] hover:text-[#ff660c] hover:shadow-[0_0_20px_rgba(255,102,12,0.28)] sm:h-10 sm:w-10 ${
                pathname === '/cart'
                  ? 'border-[#ff660c] bg-[#ff660c]/15 text-[#ff660c]'
                  : 'border-white/15 bg-[#041b26] text-[#f8fafc]'
              }`}
            >
              <ShoppingBag className="h-[17px] w-[17px] transition-transform duration-200 group-hover:scale-105 sm:h-[18px] sm:w-[18px]" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff660c] px-1 text-[10px] font-bold leading-none text-[#01121a] shadow-sm sm:-right-1.5 sm:-top-1.5 sm:h-5 sm:min-w-[20px]">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={firstName ? `Profile (${firstName})` : 'Profile'}
              className={`inline-flex h-9 w-9 items-center justify-center gap-2 border transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff660c] hover:text-[#ff660c] sm:h-10 sm:w-auto sm:px-3 ${
                pathname === '/profile'
                  ? 'border-[#ff660c] bg-[#ff660c]/15 text-[#ff660c]'
                  : 'border-white/15 bg-[#041b26] text-[#f8fafc]'
              }`}
            >
              <User className="h-[17px] w-[17px] shrink-0 sm:h-[18px] sm:w-[18px]" />
              {firstName ? (
                <span className="hidden max-w-[110px] truncate text-xs font-medium uppercase tracking-[0.14em] lg:inline">
                  {firstName}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-storefront-drawer"
              aria-label="Toggle navigation menu"
              className={`relative inline-flex h-9 w-9 items-center justify-center border p-2 transition-all duration-200 hover:border-[#ff660c] hover:text-[#ff660c] sm:h-10 sm:w-10 sm:p-2.5 md:hidden ${
                mobileMenuOpen
                  ? 'border-[#ff660c] bg-[#ff660c]/15 text-[#ff660c]'
                  : 'border-white/15 bg-[#041b26] text-white'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                  mobileMenuOpen ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              >
                <Menu className="h-5 w-5" />
              </span>
              <span
                aria-hidden="true"
                className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                  mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'
                }`}
              >
                <X className="h-5 w-5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile Full-Height Slide-Over Editorial Drawer */}
      <div
        id="mobile-storefront-drawer"
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 right-0 z-[45] flex w-full max-w-sm flex-col justify-between overflow-y-auto border-l border-[#ff660c]/30 bg-[#01121a]/98 px-6 pb-8 pt-24 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out md:hidden ${
          mobileMenuOpen
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-full opacity-0'
        }`}
      >
        <div>
          {/* Editorial Brush Brand Centerpiece */}
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff660c]">
              Lagos Contemporary Studio
            </p>
            <p className="font-brush [font-family:var(--font-brush)] mt-1.5 text-3xl tracking-wide text-[#f8fafc]">
              MAISON KRISS
            </p>
            {firstName ? (
              <div className="mt-3 inline-flex items-center gap-2 border border-white/10 bg-[#041b26] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" aria-hidden="true" />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#94a3b8]">
                  Member · <span className="text-[#f8fafc]">{firstName}</span>
                </span>
              </div>
            ) : null}
          </div>

          <nav aria-label="Mobile primary navigation" className="flex flex-col">
            {mobileNavItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                }}
                className={`group flex items-center justify-between border-b border-white/10 py-3.5 text-lg font-bold uppercase tracking-[0.16em] transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                } ${
                  item.active
                    ? 'text-[#ff660c]'
                    : item.isAdminLink
                      ? 'text-[#ff7a2e] hover:text-white'
                      : 'text-[#f8fafc] hover:text-[#ff660c]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  {item.active ? (
                    <span className="h-2 w-2 rounded-full bg-[#ff660c]" aria-hidden="true" />
                  ) : null}
                  {item.isAdminLink ? <Shield className="h-4 w-4" aria-hidden="true" /> : null}
                  <span>{item.label}</span>
                  {item.href === '/cart' && cartCount > 0 ? (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ff660c] px-1.5 text-[10px] font-bold leading-none text-[#01121a]">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                    item.active ? 'text-[#ff660c]' : 'text-slate-500 group-hover:text-[#ff660c]'
                  }`}
                />
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Quick Action & Studio Footer */}
        <div className="mt-8 flex flex-col gap-5">
          <Link
            href="/cart"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => setMobileMenuOpen(false)}
            className="flex w-full items-center justify-center gap-2.5 bg-[#ff660c] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-[#01121a] transition-colors duration-200 hover:bg-[#ff7a2e]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>View Cart ({cartCount})</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/story"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center border border-white/12 bg-[#041b26] px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8] transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center border border-white/12 bg-[#041b26] px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8] transition-colors hover:border-[#ff660c] hover:text-[#ff660c]"
            >
              Studio Desk
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.16em] text-[#94a3b8]">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff660c]" aria-hidden="true" />
              Lagos Studio · 11 NOV Edition
            </span>
            <span className="font-semibold text-[#ff660c]">MK</span>
          </div>
        </div>
      </div>
    </>
  )
}
