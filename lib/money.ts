/**
 * Consistent money (kobo -> ₦ Naira) and Africa/Lagos timestamp formatting.
 * All monetary amounts in the database and APIs are integer kobo.
 */

export function formatNaira(kobo: number, options?: { showDecimals?: boolean }): string {
  const showDecimals = options?.showDecimals ?? true
  const naira = kobo / 100
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(naira)
  return `₦${formatted}`
}

export function formatNairaCompact(kobo: number): string {
  const hasKobo = Math.abs(kobo) % 100 !== 0
  return formatNaira(kobo, { showDecimals: hasKobo })
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

export function formatLagosDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function formatLagosDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    day: '2-digit',
  }).format(d)
}

export function formatShippingAddress(address: unknown): string {
  if (!address) return 'Not provided'
  if (typeof address === 'string') return address
  if (typeof address !== 'object') return 'Not provided'

  const a = address as Record<string, unknown>
  const parts = [
    typeof a.streetAddress === 'string' ? a.streetAddress.trim() : '',
    typeof a.street === 'string' ? a.street.trim() : '',
    [
      typeof a.city === 'string' ? a.city.trim() : '',
      typeof a.state === 'string' ? a.state.trim() : '',
      typeof a.postalCode === 'string' ? a.postalCode.trim() : '',
    ]
      .filter(Boolean)
      .join(', '),
    typeof a.country === 'string' ? a.country.trim() : '',
  ].filter(Boolean)

  const base = parts.join(' · ')
  const notes = typeof a.deliveryNotes === 'string' ? a.deliveryNotes.trim() : ''
  if (!base && !notes) return 'Not provided'
  return notes ? `${base} (Notes: ${notes})` : base
}
