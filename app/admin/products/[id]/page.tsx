import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EditProductClient } from '@/components/admin/EditProductClient'

export const dynamic = 'force-dynamic'

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { id: 'asc' } },
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
          >
            ← Back to Products
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">{product.name}</h1>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="border border-[#d6d6d6] bg-white px-3.5 py-2 text-xs font-medium hover:border-[#030304]"
        >
          View in Storefront →
        </Link>
      </div>

      <EditProductClient product={product} />
    </div>
  )
}
