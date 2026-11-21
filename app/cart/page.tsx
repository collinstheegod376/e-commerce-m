import { requireUser } from '@/lib/auth'
import { getCartResponse } from '@/lib/cart'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'
import { CartClient } from '@/components/storefront/CartClient'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const user = await requireUser('/cart')
  const cart = await getCartResponse(user.id)
  const cartCount = cart.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <StorefrontHeader
        initialCartCount={cartCount}
        isAdmin={user.role === 'admin'}
        userName={user.name}
      />
      <section className="page-shell cart-page">
        <p className="page-kicker">Your selection</p>
        <CartClient
          initialCart={cart}
          profileSummary={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
          }}
        />
      </section>
    </main>
  )
}
