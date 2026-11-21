import Link from 'next/link'
import { NewProductForm } from '@/components/admin/NewProductForm'

export const dynamic = 'force-dynamic'

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
        >
          ← Back to Products
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">New Product</h1>
      </div>

      <NewProductForm />
    </div>
  )
}
