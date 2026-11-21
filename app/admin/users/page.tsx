import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatLagosDate, formatNaira } from '@/lib/money'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const pageRaw = Number(sp.page ?? '1')
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  const where: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { status: { in: ['paid', 'fulfilled'] } },
          select: { totalKobo: true },
        },
      },
    }),
    prisma.profile.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Members &amp; Access Control
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Users</h1>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 border border-[#e2e2de] bg-white p-4"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="flex-1 min-w-[220px] border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
        />
        <button
          type="submit"
          className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
        >
          Search
        </button>
        {q ? (
          <Link
            href="/admin/users"
            className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <div className="border border-[#e2e2de] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e2de] bg-[#fafaf8] text-[11px] uppercase text-[#6a6a6a]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Name</th>
                <th className="px-5 py-3.5 font-medium">Email</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium text-right">Orders</th>
                <th className="px-5 py-3.5 font-medium text-right">Total Spent</th>
                <th className="px-5 py-3.5 font-medium text-right">Joined (WAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              {profiles.length > 0 ? (
                profiles.map((p) => {
                  const spentKobo = p.orders.reduce((sum, o) => sum + o.totalKobo, 0)
                  return (
                    <tr key={p.id} className="hover:bg-[#fafaf8]">
                      <td className="px-5 py-3.5 font-semibold text-[#030304]">
                        <Link
                          href={`/admin/users/${p.id}`}
                          className="underline underline-offset-4 hover:text-[#ff5331]"
                        >
                          {p.name || 'Unnamed Member'}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-[#4a4a4a]">{p.email}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] ${
                            p.role === 'admin'
                              ? 'border-[#030304] bg-[#030304] text-white'
                              : 'border-[#d6d6d6] bg-white text-[#4a4a4a]'
                          }`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#4a4a4a]">
                        {p._count.orders}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#030304]">
                        {formatNaira(spentKobo)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#6a6a6a]">
                        {formatLagosDate(p.createdAt)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#757575]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e2e2de] px-5 py-3 text-xs text-[#6a6a6a]">
          <span>
            Page {page} of {totalPages} ({total} total users)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304] hover:border-[#030304]"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}
                className="border border-[#d6d6d6] px-3 py-1 text-[#030304] hover:border-[#030304]"
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
