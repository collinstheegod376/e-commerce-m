import Link from 'next/link'
import {
  getLowStockAlerts,
  getOverviewStats,
  getPaymentOutcomes,
  getRecentOrders,
  getRevenueSeries,
  getSizeDistribution,
  getTopProducts,
} from '@/lib/admin-analytics'
import { formatLagosDate, formatNaira } from '@/lib/money'
import { OverviewCharts } from '@/components/admin/OverviewCharts'
import { StatusBadge } from '@/components/admin/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const [
    overview,
    revenue30d,
    paymentOutcomes,
    topProducts,
    sizes,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    getOverviewStats(),
    getRevenueSeries('30d'),
    getPaymentOutcomes(),
    getTopProducts(10),
    getSizeDistribution(),
    getLowStockAlerts(5),
    getRecentOrders(10),
  ])

  const statCards = [
    { label: 'Total Revenue', value: formatNaira(overview.revenue) },
    { label: 'Paid Orders', value: overview.orders.toLocaleString('en-NG') },
    { label: 'Members', value: overview.users.toLocaleString('en-NG') },
    { label: 'Average Order Value', value: formatNaira(overview.aov) },
    { label: 'Payment Success Rate', value: `${overview.successRate.toFixed(1)}%` },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
            Analytics &amp; Store Health
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="bg-[#030304] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="border border-[#e2e2de] bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#030304]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <OverviewCharts
        initialRange="30d"
        initialSeries={revenue30d}
        paymentOutcomes={paymentOutcomes}
      />

      {/* Top Products + Size Distribution + Low Stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
            Best Performers
          </p>
          <h2 className="mt-1 mb-4 text-lg font-bold tracking-[-0.03em]">Top Products</h2>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e2e2de] text-[11px] uppercase text-[#6a6a6a]">
                  <tr>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td className="py-2.5 font-medium text-[#030304]">
                        <Link
                          href={`/admin/products/${p.productId}`}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right text-[#4a4a4a]">{p.qtySold}</td>
                      <td className="py-2.5 text-right font-semibold text-[#030304]">
                        {formatNaira(p.revenueKobo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#757575]">No paid product sales yet.</p>
          )}
        </div>

        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
            Fit Breakdown
          </p>
          <h2 className="mt-1 mb-4 text-lg font-bold tracking-[-0.03em]">
            Size Distribution
          </h2>
          {sizes.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e2e2de] text-[11px] uppercase text-[#6a6a6a]">
                <tr>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {sizes.map((s) => (
                  <tr key={s.size}>
                    <td className="py-2.5 font-semibold text-[#030304]">{s.size}</td>
                    <td className="py-2.5 text-right text-[#4a4a4a]">{s.qtySold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[#757575]">No paid size data yet.</p>
          )}
        </div>

        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#ff5331]">
                Inventory Watch (Stock &lt; 5)
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">
                Low Stock Alerts
              </h2>
            </div>
            <span className="border border-[#ff5331] px-2 py-0.5 text-xs font-semibold text-[#ff5331]">
              {lowStock.length}
            </span>
          </div>

          {lowStock.length > 0 ? (
            <ul className="divide-y divide-[#f0f0ec] text-xs">
              {lowStock.map((alert) => (
                <li key={alert.variantId} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/products/${alert.productId}`}
                      className="font-semibold text-[#030304] hover:underline"
                    >
                      {alert.productName}
                    </Link>
                    <p className="text-[11px] text-[#6a6a6a]">
                      Size {alert.size}
                      {alert.sku ? ` · ${alert.sku}` : ''}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-semibold ${
                      alert.stockQty === 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {alert.stockQty === 0 ? 'Out of stock' : `${alert.stockQty} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#757575]">All tracked variants have 5+ units in stock.</p>
          )}
        </div>
      </div>

      {/* Recent 10 Orders */}
      <div className="border border-[#e2e2de] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Latest Activity
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">Recent 10 Orders</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-medium uppercase tracking-[0.06em] underline underline-offset-4"
          >
            All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e2de] text-[11px] uppercase text-[#6a6a6a]">
              <tr>
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Date (WAT)</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafaf8]">
                    <td className="py-3 font-mono font-semibold">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-4 hover:text-[#ff5331]"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="py-3 text-[#4a4a4a]">{formatLagosDate(order.createdAt)}</td>
                    <td className="py-3">
                      <div className="font-medium text-[#030304]">
                        {order.user?.name || order.customerEmail}
                      </div>
                      <div className="text-[11px] text-[#757575]">{order.customerEmail}</div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-right font-semibold text-[#030304]">
                      {formatNaira(order.totalKobo)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#757575]">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
