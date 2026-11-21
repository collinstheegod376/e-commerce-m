const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  fulfilled: 'bg-[#030304] text-white border-[#030304]',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  abandoned: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  refunded: 'bg-orange-50 text-orange-800 border-orange-200',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700 border-neutral-200'
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] ${cls}`}
    >
      {status}
    </span>
  )
}
