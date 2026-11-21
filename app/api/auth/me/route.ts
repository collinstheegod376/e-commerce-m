import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { handleRouteError, jsonError } from '@/lib/http'

export async function GET() {
  try {
    const profile = await getUser()
    if (!profile) {
      return jsonError(401, 'Not authenticated.', 'UNAUTHORIZED')
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
    })
  } catch (err) {
    return handleRouteError(err, 'auth/me')
  }
}
