'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Menu, X } from 'lucide-react'

interface AuthEditorialShellProps {
  kicker: string
  headline: string
  subcopy: string
  children: React.ReactNode
}

function MkMonogramBadge() {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#ff660c]/60 bg-[#ff660c]/10 text-[#ff660c] transition-all duration-300 group-hover:border-[#ff660c] group-hover:bg-[#ff660c] group-hover:text-[#01121a]"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-5 w-5"
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

export function AuthEditorialShell({
  kicker,
  headline,
  subcopy,
  children,
}: AuthEditorialShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

  const authNavItems = [
    {
      label: 'Sign In',
      shortLabel: 'Sign In',
      href: '/login',
      active: pathname === '/login',
    },
    {
      label: 'Create Account',
      shortLabel: 'Sign Up',
      href: '/signup',
      active: pathname === '/signup',
    },
    {
      label: 'Recovery',
      shortLabel: 'Recovery',
      href: '/forgot-password',
      active: pathname === '/forgot-password' || pathname === '/reset-password',
    },
    {
      label: 'Our Story',
      shortLabel: 'Story',
      href: '/story',
      active: pathname === '/story',
    },
    {
      label: 'Contact',
      shortLabel: 'Contact',
      href: '/contact',
      active: pathname === '/contact',
    },
  ]

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#01121a] text-[#f8fafc] selection:bg-[#ff660c] selection:text-[#01121a]">
      {/* Subtle atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#ff660c]/8 blur-[120px]" />
        <div className="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-[#072330]/80 blur-[110px]" />
      </div>

      {/* Responsive Dark-Petrol & Orange Auth Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#01121a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8 lg:px-12">
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff660c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#01121a]"
          >
            <MkMonogramBadge />
            <span className="font-display text-lg font-bold uppercase tracking-[0.18em] text-[#ff660c] transition-colors duration-300 group-hover:text-white sm:text-xl">
              Maison Kriss
            </span>
          </Link>

          {/* Desktop Auth Navigation */}
          <nav
            aria-label="Auth navigation"
            className="hidden items-center gap-8 md:flex lg:gap-10"
          >
            {authNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#ff660c] after:transition-all after:duration-300 after:content-[''] ${
                  item.active
                    ? 'text-[#ff660c] after:w-full'
                    : 'text-slate-300 hover:text-[#ff660c] after:w-0 hover:after:w-full'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Badge + Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 border border-white/12 bg-[#041b26] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" aria-hidden="true" />
              Members Only · Lagos
            </span>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-auth-drawer"
              aria-label="Toggle authentication menu"
              className={`relative inline-flex h-10 w-10 items-center justify-center border p-2.5 transition-all duration-200 hover:border-[#ff660c] hover:text-[#ff660c] md:hidden ${
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

      {/* Mobile Auth Drawer Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile Auth Slide-Over Drawer */}
      <div
        id="mobile-auth-drawer"
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label="Mobile authentication navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 right-0 z-[45] flex w-full max-w-sm flex-col justify-between overflow-y-auto border-l border-[#ff660c]/30 bg-[#01121a]/98 px-6 pb-8 pt-24 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out md:hidden ${
          mobileMenuOpen
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-full opacity-0'
        }`}
      >
        <div>
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff660c]">
              Private Archive Access
            </p>
            <p className="font-brush [font-family:var(--font-brush)] mt-1.5 text-3xl tracking-wide text-[#f8fafc]">
              MAISON KRISS
            </p>
          </div>

          <nav aria-label="Mobile auth links" className="flex flex-col">
            {authNavItems.map((item, index) => (
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
                } ${item.active ? 'text-[#ff660c]' : 'text-[#f8fafc] hover:text-[#ff660c]'}`}
              >
                <span className="inline-flex items-center gap-2.5">
                  {item.active ? (
                    <span className="h-2 w-2 rounded-full bg-[#ff660c]" aria-hidden="true" />
                  ) : null}
                  <span>{item.label}</span>
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

        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.18em] text-[#94a3b8]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" aria-hidden="true" />
            Members Only · Lagos Studio
          </span>
          <span className="font-semibold text-[#ff660c]">11 NOV</span>
        </div>
      </div>

      {/* Mobile Quick-Switch Auth Pill Bar */}
      <div className="border-b border-white/10 bg-[#041b26]/90 px-4 py-2.5 md:hidden">
        <nav
          aria-label="Quick auth switch"
          className="grid grid-cols-3 gap-1.5 rounded-sm border border-white/10 bg-[#01121a] p-1"
        >
          {authNavItems.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center py-2 text-center text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                item.active
                  ? 'bg-[#ff660c] font-bold text-[#01121a]'
                  : 'font-medium text-slate-300 hover:text-[#ff660c]'
              }`}
            >
              {item.shortLabel}
            </Link>
          ))}
        </nav>
      </div>

      {/* Responsive 2-Column Desktop / Stacked Mobile Auth Layout */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 py-8 sm:px-8 sm:py-10 lg:min-h-[calc(100dvh-73px)] lg:grid-cols-12 lg:items-stretch lg:gap-10 lg:px-12 lg:py-12">
        {/* Left — Editorial Brand Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden border border-white/12 border-t-2 border-t-[#ff660c] bg-gradient-to-br from-[#072330] via-[#041b26] to-[#01121a] p-6 sm:p-10 lg:col-span-7 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-10 h-[74%] w-[68%] opacity-25 mix-blend-screen sm:opacity-35 lg:h-[82%] lg:w-[74%]"
          >
            <Image
              src="/assets/57c8a.png"
              alt=""
              width={900}
              height={1100}
              priority
              sizes="(max-width: 1024px) 70vw, 45vw"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#01121a]/90 via-transparent to-transparent"
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 border border-[#ff660c]/35 bg-[#ff660c]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff660c]">
                {kicker}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#94a3b8]">
                11 NOV Edition
              </span>
            </div>

            <h1 className="font-brush [font-family:var(--font-brush)] mt-6 max-w-xl text-4xl uppercase leading-[1.06] tracking-[0.02em] text-[#f8fafc] sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl">
              {headline}
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#94a3b8] sm:text-base">
              {subcopy}
            </p>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-[11px] uppercase tracking-[0.18em] text-[#94a3b8] lg:mt-16">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff660c]" aria-hidden="true" />
              Lagos Studio · Private Archive
            </span>
            <span className="text-slate-400">Studio Lookbooks · Numbered Drops</span>
          </div>
        </div>

        {/* Right — Auth Form Panel */}
        <div className="flex flex-col justify-center border border-white/12 bg-[#041b26]/90 p-6 shadow-2xl backdrop-blur-md sm:p-10 lg:col-span-5 lg:p-12">
          <div
            className={[
              'w-full',
              '[&_.page-kicker]:mb-2 [&_.page-kicker]:text-[11px] [&_.page-kicker]:font-semibold [&_.page-kicker]:uppercase [&_.page-kicker]:tracking-[0.2em] [&_.page-kicker]:text-[#ff660c]!',
              '[&_h2]:font-brush [&_h2]:[font-family:var(--font-brush)] [&_h2]:mb-8 [&_h2]:text-3xl [&_h2]:uppercase [&_h2]:leading-[1.08] [&_h2]:tracking-[0.03em] [&_h2]:text-[#f8fafc] sm:[&_h2]:text-4xl',
              '[&_label]:mb-6 [&_label]:block',
              '[&_label>span]:mb-2 [&_label>span]:block [&_label>span]:text-[11px] [&_label>span]:font-medium [&_label>span]:uppercase [&_label>span]:tracking-[0.16em] [&_label>span]:text-[#94a3b8]',
              '[&_input]:w-full [&_input]:border [&_input]:border-white/15 [&_input]:bg-[#01121a]/80 [&_input]:px-4 [&_input]:py-3.5 [&_input]:text-sm [&_input]:text-[#f8fafc] [&_input]:placeholder:text-slate-500 [&_input]:outline-none [&_input]:transition-colors [&_input:focus]:border-[#ff660c] [&_input:focus]:bg-[#01121a]',
              '[&_.primary-action]:mt-2 [&_.primary-action]:inline-flex [&_.primary-action]:w-full [&_.primary-action]:items-center [&_.primary-action]:justify-center [&_.primary-action]:border-0 [&_.primary-action]:bg-[#ff660c]! [&_.primary-action]:px-6 [&_.primary-action]:py-4 [&_.primary-action]:text-xs [&_.primary-action]:font-bold [&_.primary-action]:uppercase [&_.primary-action]:tracking-[0.18em] [&_.primary-action]:text-[#01121a]! [&_.primary-action]:transition-colors [&_.primary-action:hover]:bg-[#ff7a2e]!',
              '[&_form_a]:text-[#94a3b8]! [&_form_a]:transition-colors [&_form_a:hover]:text-[#ff660c]!',
              "[&_div[role='alert']]:border-l-2 [&_div[role='alert']]:border-[#ff660c]! [&_div[role='alert']]:bg-[#ff660c]/15! [&_div[role='alert']]:text-[#f8fafc]!",
            ].join(' ')}
          >
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
