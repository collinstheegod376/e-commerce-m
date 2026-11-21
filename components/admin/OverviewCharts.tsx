'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNaira, formatNairaCompact } from '@/lib/money'
import type {
  PaymentOutcomeStats,
  RevenuePoint,
  RevenueRange,
} from '@/lib/admin-analytics'

interface OverviewChartsProps {
  initialRange: RevenueRange
  initialSeries: RevenuePoint[]
  paymentOutcomes: PaymentOutcomeStats
}

const RANGES: Array<{ value: RevenueRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
]

const DONUT_COLORS = ['#030304', '#ff5331', '#a3a3a3', '#d4a017']

export function OverviewCharts({
  initialRange,
  initialSeries,
  paymentOutcomes,
}: OverviewChartsProps) {
  const [range, setRange] = useState<RevenueRange>(initialRange)
  const [series, setSeries] = useState<RevenuePoint[]>(initialSeries)
  const [loading, setLoading] = useState(false)

  async function handleRangeChange(nextRange: RevenueRange) {
    setRange(nextRange)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stats/revenue?range=${nextRange}`)
      if (res.ok) {
        const data = (await res.json()) as RevenuePoint[]
        setSeries(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const chartData = series.map((pt) => ({
    date: pt.date,
    revenueNaira: Math.round(pt.revenueKobo / 100),
    revenueKobo: pt.revenueKobo,
    orders: pt.orders,
  }))

  const donutData = [
    { name: 'Paid', value: paymentOutcomes.paid },
    { name: 'Failed', value: paymentOutcomes.failed },
    { name: 'Abandoned', value: paymentOutcomes.abandoned },
    { name: 'Pending', value: paymentOutcomes.pending },
  ].filter((d) => d.value > 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Revenue Line Chart */}
      <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Paid Revenue Over Time
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">
              Revenue Trend (₦)
            </h2>
          </div>

          <div className="inline-flex border border-[#d6d6d6] bg-[#f7f7f5]">
            {RANGES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRangeChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === opt.value
                    ? 'bg-[#030304] text-white'
                    : 'text-[#4a4a4a] hover:text-[#030304]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`h-[260px] w-full ${loading ? 'opacity-50' : ''}`}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#ecece8" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6a6a6a' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6a6a6a' }}
                  tickFormatter={(val: number) => `₦${val.toLocaleString('en-NG')}`}
                  width={84}
                />
                <Tooltip
                  formatter={(value: number) => [formatNaira(value * 100), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#030304',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenueNaira"
                  stroke="#030304"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ff5331' }}
                  activeDot={{ r: 5, fill: '#ff5331' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-[#d6d6d6] text-xs text-[#757575]">
              No paid revenue recorded in this time range yet.
            </div>
          )}
        </div>
      </div>

      {/* Payment Outcomes Donut */}
      <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-4 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Checkout Funnel
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">Payment Outcomes</h2>

        <div className="h-[200px] w-full mt-4">
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {donutData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-[#d6d6d6] text-xs text-[#757575]">
              No orders recorded yet.
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#ecece8] pt-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#4a4a4a]">Paid</span>
            <strong>{paymentOutcomes.paid}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#ff5331]">Failed</span>
            <strong>{paymentOutcomes.failed}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#757575]">Abandoned</span>
            <strong>{paymentOutcomes.abandoned}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-700">Pending</span>
            <strong>{paymentOutcomes.pending}</strong>
          </div>
        </div>
      </div>

      {/* Orders Bar Chart */}
      <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
              Order Volume ({range.toUpperCase()})
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.03em]">
              Paid Orders Per Day
            </h2>
          </div>
          <span className="text-xs text-[#6a6a6a]">
            Total in view:{' '}
            <strong>
              {formatNairaCompact(series.reduce((sum, pt) => sum + pt.revenueKobo, 0))}
            </strong>
          </span>
        </div>

        <div className={`h-[210px] w-full ${loading ? 'opacity-50' : ''}`}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#ecece8" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6a6a6a' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6a6a6a' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#030304',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="orders" fill="#030304" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center border border-dashed border-[#d6d6d6] text-xs text-[#757575]">
              No paid orders in this range yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
