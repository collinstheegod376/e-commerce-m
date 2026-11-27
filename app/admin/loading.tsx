export default function AdminLoading() {
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading admin dashboard"
    >
      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-36 rounded bg-[#e2e2de]" />
          <div className="h-9 w-52 rounded bg-[#dcdcd7]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 rounded bg-[#dcdcd7]" />
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="border border-[#e2e2de] bg-white p-5 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-[#ecece9]" />
            <div className="h-7 w-32 rounded bg-[#dcdcd7]" />
          </div>
        ))}
      </div>

      {/* Analytics & Charts Skeleton */}
      <div className="border border-[#e2e2de] bg-white p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-[#ecece9]" />
            <div className="h-6 w-48 rounded bg-[#dcdcd7]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 rounded bg-[#ecece9]" />
            <div className="h-8 w-16 rounded bg-[#ecece9]" />
            <div className="h-8 w-16 rounded bg-[#ecece9]" />
          </div>
        </div>

        {/* Visual Chart Bars Mockup */}
        <div className="h-64 sm:h-72 w-full rounded bg-[#f6f6f3] p-4 flex items-end justify-between gap-2 sm:gap-3">
          {[42, 68, 35, 88, 54, 96, 72, 48, 82, 64, 92, 78].map((height, idx) => (
            <div
              key={idx}
              className="w-full rounded-t bg-[#e2e2de] transition-all"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Grid: Tables / Activity Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Table 1: Top Products / Performance */}
        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-[#ecece9]" />
            <div className="h-5 w-40 rounded bg-[#dcdcd7]" />
          </div>
          <div className="space-y-3 pt-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-[#f0f0ec]"
              >
                <div className="h-4 w-44 rounded bg-[#ecece9]" />
                <div className="h-4 w-12 rounded bg-[#ecece9]" />
                <div className="h-4 w-24 rounded bg-[#dcdcd7]" />
              </div>
            ))}
          </div>
        </div>

        {/* Table 2: Secondary Metric / Distribution */}
        <div className="border border-[#e2e2de] bg-white p-6 lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-[#ecece9]" />
            <div className="h-5 w-36 rounded bg-[#dcdcd7]" />
          </div>
          <div className="space-y-3 pt-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-[#f0f0ec]"
              >
                <div className="h-4 w-28 rounded bg-[#ecece9]" />
                <div className="h-4 w-16 rounded bg-[#dcdcd7]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
