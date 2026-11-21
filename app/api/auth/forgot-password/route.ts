import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, extractClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/http'
import { getSupportConfig } from '@/lib/support'

const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
})

const GENERIC_SUCCESS_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.'

export async function POST(request: NextRequest) {
  try {
    const body = forgotSchema.parse(await request.json())
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`forgot:${ip}:${body.email}`, 5, 60)
    if (!limit.allowed) {
      return jsonError(
        429,
        'Too many reset requests. Please wait a minute and try again.',
        'RATE_LIMITED',
        rateLimitHeaders(limit),
      )
    }

    const supabase = await createServerSupabaseClient()
    const { siteUrl } = getSupportConfig()

    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/confirm?next=/reset-password`,
    })

    if (error) {
      // Log internally, never leak whether email exists
      console.warn('[auth:forgot-password] Supabase error:', error.message)
    }

    return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE })
  } catch (err) {
    return handleRouteError(err, 'auth/forgot-password')
  }
}
