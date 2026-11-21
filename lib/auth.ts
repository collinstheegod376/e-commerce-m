import 'server-only'
import { redirect } from 'next/navigation'
import type { Profile } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ApiError } from '@/lib/http'

export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ''
  const allowed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

export function sanitizeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed
}

/**
 * Ensures a Profile row exists for an authenticated Supabase auth.users record.
 * Works alongside the Postgres on_auth_user_created trigger and also handles
 * ADMIN_EMAILS role assignment from the Node runtime environment.
 */
export async function ensureProfileForAuthUser(authUser: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): Promise<Profile | null> {
  const email = authUser.email?.trim().toLowerCase()
  if (!email) return null

  const metaName =
    typeof authUser.user_metadata?.name === 'string'
      ? authUser.user_metadata.name.trim()
      : null

  const shouldBeAdmin = isAdminEmail(email)

  const existing = await prisma.profile.findUnique({ where: { id: authUser.id } })
  if (existing) {
    if (shouldBeAdmin && existing.role !== 'admin') {
      return prisma.profile.update({
        where: { id: existing.id },
        data: { role: 'admin' },
      })
    }
    return existing
  }

  return prisma.profile.upsert({
    where: { id: authUser.id },
    update: {
      email,
      ...(metaName ? { name: metaName } : {}),
      ...(shouldBeAdmin ? { role: 'admin' } : {}),
    },
    create: {
      id: authUser.id,
      email,
      name: metaName,
      role: shouldBeAdmin ? 'admin' : 'customer',
    },
  })
}

/**
 * Returns the authenticated user's Profile, or null if logged out.
 */
export async function getUser(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return ensureProfileForAuthUser(user)
}

/**
 * Server Component guard: returns Profile or redirects to /login?next=...
 */
export async function requireUser(nextPath = '/'): Promise<Profile> {
  const profile = await getUser()
  if (!profile) {
    const safeNext = sanitizeNextPath(nextPath, '/')
    redirect(`/login?next=${encodeURIComponent(safeNext)}`)
  }
  return profile
}

/**
 * Server Component admin guard: requires signed-in admin Profile or redirects.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getUser()
  if (!profile) {
    redirect('/login?next=%2Fadmin')
  }
  if (profile.role !== 'admin') {
    redirect('/')
  }
  return profile
}

/**
 * Route Handler user guard: returns Profile or throws ApiError(401).
 */
export async function requireApiUser(): Promise<Profile> {
  const profile = await getUser()
  if (!profile) {
    throw new ApiError(401, 'Authentication required. Please sign in.', 'UNAUTHORIZED')
  }
  return profile
}

/**
 * Route Handler admin guard: defense-in-depth first line of every /api/admin/* route.
 */
export async function requireApiAdmin(): Promise<Profile> {
  const profile = await getUser()
  if (!profile) {
    throw new ApiError(401, 'Authentication required.', 'UNAUTHORIZED')
  }
  if (profile.role !== 'admin') {
    throw new ApiError(403, 'Admin privileges required.', 'FORBIDDEN')
  }
  return profile
}
