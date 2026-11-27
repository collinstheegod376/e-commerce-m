'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  BarChart3,
  FileText,
  LifeBuoy,
  Loader2,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'

interface AdminShellProps {
  adminName: string
  adminEmail: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/products', label: 'Products', icon: Package, exact: false },
  { href: '/admin/content', label: 'Content', icon: FileText, exact: false },
  { href: '/admin/support-links', label: 'Support Links', icon: LifeBuoy, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
]

export function AdminShell({ adminName, adminEmail, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutNavPending, startSignOutTransition] = useTransition()
  const signingOut = isSigningOut || signOutNavPending

  const [navPending, startNavTransition] = useTransition()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  function handleNavClick(href: string, e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === href) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setPendingHref(href)
    startNavTransition(() => {
      router.push(href)
    })
  }

  async function handleSignOut() {
    if (signingOut) return
    setIsSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      startSignOutTransition(() => {
        router.push('/login')
        router.refresh()
      })
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#f6f6f3] text-[#030304] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-[#030304] text-white flex flex-col border-b md:border-b-0 md:border-r border-[#1f1f22]">
        <div className="px-4 py-4 md:px-6 md:py-6 border-b border-[#1f1f22] flex items-center justify-between gap-3 md:block">
          <Link href="/admin" className="block min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#ff5331]">
              Maison Kriss
            </span>
            <h1 className="mt-0.5 text-lg font-bold tracking-[-0.04em] text-white md:mt-1 md:text-xl">
              Studio Admin
            </h1>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 border border-[#2a2a2e] px-2.5 py-1.5 text-[11px] text-[#d4d4d4] transition-colors hover:border-white hover:text-white md:hidden"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </Link>
        </div>

        <nav
          className="flex-1 px-3 py-2.5 md:py-4 flex md:flex-col gap-1 overflow-x-auto max-w-full"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const isNavigating = navPending && pendingHref === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                className={[
                  'shrink-0 flex min-h-[40px] items-center gap-2.5 md:gap-3 px-3 py-2 text-xs font-medium tracking-[0.02em] transition-all whitespace-nowrap active:scale-[0.98]',
                  active
                    ? 'bg-white text-[#030304]'
                    : isNavigating
                      ? 'bg-[#1a1a1d] text-white ring-1 ring-[#ff5331]/60'
                      : 'text-[#b5b5b5] hover:bg-[#161618] hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {isNavigating ? (
                  <Loader2 className="ml-auto h-3 w-3 animate-spin text-[#ff5331]" aria-hidden="true" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:block px-3 py-4 border-t border-[#1f1f22]">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#b5b5b5] hover:text-white transition-colors"
          >
            <Store className="h-4 w-4" />
            <span>View Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <header className="min-h-14 md:h-16 bg-white border-b border-[#e2e2de] px-4 py-2.5 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#ff5331]" />
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.08em] text-[#6a6a6a] truncate">
              Lagos Operations · Locked Admin Zone
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#030304]">{adminName}</div>
              <div className="text-[11px] text-[#757575]">{adminEmail}</div>
            </div>
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              aria-busy={signingOut}
              className="inline-flex min-h-[36px] items-center gap-1.5 border border-[#d6d6d6] bg-white px-3 py-1.5 text-xs font-medium text-[#030304] hover:border-[#030304] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff5331]" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full min-w-0 mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
