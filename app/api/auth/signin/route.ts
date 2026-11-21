import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileForAuthUser } from '@/lib/auth'
import { checkRateLimit, extractClientIp } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/http'

const signinSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body = signinSchema.parse(await request.json())
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`signin:${ip}:${body.email}`, 5, 60)
    if (!limit.allowed) {
      return jsonError(429, 'Too many sign-in attempts. Please wait a minute and try again.', 'RATE_LIMITED')
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error || !data.user) {
      return jsonError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
    }

    const profile = await ensureProfileForAuthUser(data.user)

    return NextResponse.json({
      user: profile
        ? { id: profile.id, email: profile.email, name: profile.name, role: profile.role }
        : { id: data.user.id, email: data.user.email, name: null, role: 'customer' },
    })
  } catch (err) {
    return handleRouteError(err, 'auth/signin')
  }
}
