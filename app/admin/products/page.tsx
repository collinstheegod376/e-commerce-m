import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatNaira } from '@/lib/money'
import { ProductActiveToggle } from '@/components/admin/ProductActiveToggle'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const pageRaw = Number(sp.page ?? '1')
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        variants: {
          select: { id: true, size: true, stockQty: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
            Catalog &amp; Inventory
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Products</h1>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-[#030304] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
        >
          + Add Product
        </Link>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 border border-[#e2e2de] bg-white p-4"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products by name or slug…"
          className="flex-1 min-w-[220px] border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
        />
        <button
          type="submit"
          className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white"
        >
          Search
        </button>
        {q ? (
          <Link href="/admin/products" className="text-xs text-[#6a6a6a] underline">
            Reset
          </Link>
        ) : null}
      </form>

      <div className="border border-[#e2e2de] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e2de] bg-[#fafaf8] text-[11px] uppercase text-[#6a6a6a]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Piece</th>
                <th className="px-5 py-3.5 font-medium text-right">Price</th>
                <th className="px-5 py-3.5 font-medium text-right">Variants</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#fafaf8]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden border border-[#e2e2de] bg-[#edf0ed]">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover mix-blend-darken"
                            />
                          ) : null}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-semibold text-[#030304] hover:underline"
                          >
                            {product.name}
                          </Link>
                          <div className="font-mono text-[11px] text-[#757575]">
                            /{product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#030304]">
                      {formatNaira(product.priceKobo)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#4a4a4a]">
                      {product.variants.length}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block border px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] ${
                          product.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="border border-[#030304] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] text-[#030304] hover:bg-[#030304] hover:text-white"
                        >
                          Edit
                        </Link>
                        <ProductActiveToggle
                          productId={product.id}
                          active={product.active}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#757575]">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e2e2de] px-5 py-3 text-xs text-[#6a6a6a]">
          <span>
            Page {page} of {totalPages} ({total} total products)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304]"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
