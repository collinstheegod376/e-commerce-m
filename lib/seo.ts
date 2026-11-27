export const CANONICAL_ORIGIN = 'https://www.maisonkriss.shop'

export function canonicalUrl(pathname: string): string {
  if (!pathname || pathname === '/') {
    return `${CANONICAL_ORIGIN}/`
  }
  const normalized = pathname.replace(/^\/+|\/+$/g, '')
  return `${CANONICAL_ORIGIN}/${normalized}`
}

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} as const
