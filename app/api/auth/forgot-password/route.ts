import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { emails } from '@/lib/emails'
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

    const { siteUrl } = getSupportConfig()
    const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey && serviceRoleKey && supabaseUrl) {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: body.email,
        options: {
          redirectTo: `${normalizedSiteUrl}/auth/confirm?next=/reset-password`,
        },
      })

      if (error) {
        // Log internally, never leak whether email exists
        console.warn('[auth:forgot-password] Supabase generateLink error:', error.message)
      } else if (data?.properties?.hashed_token) {
        const resetUrl = `${normalizedSiteUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=/reset-password`
        await emails.sendPasswordResetEmail({
          to: body.email,
          resetUrl,
        })
      }

      return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE })
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${normalizedSiteUrl}/auth/confirm?next=/reset-password`,
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
