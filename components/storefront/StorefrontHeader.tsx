'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface StorefrontHeaderProps {
  initialCartCount: number
  isAdmin: boolean
  userName?: string | null
}

export function StorefrontHeader({
  initialCartCount,
  isAdmin,
}: StorefrontHeaderProps) {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(initialCartCount)

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

  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        Maison Kriss
      </Link>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link
          className={pathname === '/' || pathname.startsWith('/products') ? 'active' : ''}
          href="/"
        >
          products
        </Link>
        <Link className={pathname === '/story' ? 'active' : ''} href="/story">
          story
        </Link>
        <Link className={pathname === '/contact' ? 'active' : ''} href="/contact">
          contact
        </Link>
        <Link className={pathname === '/profile' ? 'active' : ''} href="/profile">
          account
        </Link>
        {isAdmin ? (
          <Link
            className="text-[#ff5331] font-medium"
            href="/admin"
          >
            admin
          </Link>
        ) : null}
      </nav>
      <div className="header-actions">
        <Link
          href="/cart"
          className="icon-button inline-flex items-center justify-center"
          aria-label={`Cart with ${cartCount} items`}
        >
          <img src="/assets/ac74f.svg" alt="" />
          {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
        </Link>
        <Link
          href="/profile"
          className="icon-button inline-flex items-center justify-center"
          aria-label="Profile"
        >
          <img src="/assets/b44a0.svg" alt="" />
        </Link>
      </div>
    </header>
  )
}
