'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  FileText,
  LifeBuoy,
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
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-[#030304] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-[#030304] text-white flex flex-col border-b md:border-b-0 md:border-r border-[#1f1f22]">
        <div className="px-6 py-6 border-b border-[#1f1f22]">
          <Link href="/admin" className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#ff5331]">
              Maison Kriss
            </span>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.04em] text-white">
              Studio Admin
            </h1>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex md:flex-col gap-1 overflow-x-auto" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-[0.02em] transition-colors whitespace-nowrap',
                  active
                    ? 'bg-white text-[#030304]'
                    : 'text-[#b5b5b5] hover:bg-[#161618] hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
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
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#e2e2de] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ff5331]" />
            <span className="text-xs uppercase tracking-[0.08em] text-[#6a6a6a] truncate">
              Lagos Operations · Locked Admin Zone
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#030304]">{adminName}</div>
              <div className="text-[11px] text-[#757575]">{adminEmail}</div>
            </div>
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 border border-[#d6d6d6] bg-white px-3 py-1.5 text-xs font-medium text-[#030304] hover:border-[#030304] disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
