import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, extractClientIp } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/http'

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body = resetSchema.parse(await request.json())
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`reset:${ip}`, 5, 60)
    if (!limit.allowed) {
      return jsonError(429, 'Too many password reset attempts. Please wait a minute.', 'RATE_LIMITED')
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonError(
        401,
        'Your reset link is invalid or has expired. Please request a new password reset.',
        'UNAUTHORIZED',
      )
    }

    const { error } = await supabase.auth.updateUser({
      password: body.password,
    })

    if (error) {
      return jsonError(400, error.message, 'RESET_FAILED')
    }

    return NextResponse.json({ ok: true, message: 'Password updated successfully.' })
  } catch (err) {
    return handleRouteError(err, 'auth/reset-password')
  }
}
