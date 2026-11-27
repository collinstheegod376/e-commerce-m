import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureProfileForAuthUser } from '@/lib/auth'
import { emails } from '@/lib/emails'
import { checkRateLimit, extractClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/http'
import { getSupportConfig } from '@/lib/support'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export async function POST(request: NextRequest) {
  try {
    const body = signupSchema.parse(await request.json())
    const ip = extractClientIp(request.headers)

    const limit = await checkRateLimit(`signup:${ip}:${body.email}`, 5, 60)
    if (!limit.allowed) {
      return jsonError(
        429,
        'Too many signup attempts. Please wait a minute and try again.',
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
        type: 'signup',
        email: body.email,
        password: body.password,
        options: {
          data: { name: body.name },
          redirectTo: `${normalizedSiteUrl}/auth/confirm`,
        },
      })

      if (error) {
        return jsonError(400, error.message, 'SIGNUP_FAILED')
      }

      const hashedToken = data.properties?.hashed_token
      if (!hashedToken) {
        return jsonError(
          500,
          'Could not generate email confirmation link. Please try again.',
          'SIGNUP_LINK_FAILED',
        )
      }

      const confirmUrl = `${normalizedSiteUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=signup`

      let profile = null
      if (data.user) {
        try {
          profile = await ensureProfileForAuthUser({
            id: data.user.id,
            email: data.user.email ?? body.email,
            user_metadata: { name: body.name },
          })
        } catch (profileErr) {
          console.warn('[auth:signup] Profile upsert deferred:', profileErr)
        }
      }

      await emails.sendAuthConfirmationEmail({
        to: body.email,
        name: body.name,
        confirmUrl,
      })

      return NextResponse.json(
        {
          user: profile
            ? { id: profile.id, email: profile.email, name: profile.name, role: profile.role }
            : data.user
              ? { id: data.user.id, email: data.user.email ?? body.email, name: body.name, role: 'customer' }
              : null,
          needsEmailConfirmation: true,
          message: 'Check your email to confirm your account before signing in.',
        },
        { status: 201 },
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { name: body.name },
        emailRedirectTo: `${normalizedSiteUrl}/auth/confirm?next=/`,
      },
    })

    if (error) {
      return jsonError(400, error.message, 'SIGNUP_FAILED')
    }

    // Ensure profile row exists (reconciles ADMIN_EMAILS alongside Agent 1's DB trigger)
    let profile = null
    if (data.user) {
      try {
        profile = await ensureProfileForAuthUser({
          id: data.user.id,
          email: data.user.email ?? body.email,
          user_metadata: { name: body.name },
        })
      } catch (profileErr) {
        console.warn('[auth:signup] Profile upsert deferred:', profileErr)
      }
    }

    const needsEmailConfirmation = !data.session

    return NextResponse.json(
      {
        user: profile
          ? { id: profile.id, email: profile.email, name: profile.name, role: profile.role }
          : data.user
            ? { id: data.user.id, email: data.user.email ?? body.email, name: body.name, role: 'customer' }
            : null,
        needsEmailConfirmation,
        message: needsEmailConfirmation
          ? 'Check your email to confirm your account before signing in.'
          : 'Account created successfully.',
      },
      { status: 201 },
    )
  } catch (err) {
    return handleRouteError(err, 'auth/signup')
  }
}
