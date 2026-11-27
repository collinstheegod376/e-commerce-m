import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sanitizeNextPath } from '@/lib/auth'

const VALID_OTP_TYPES: ReadonlySet<string> = new Set([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const typeParam = searchParams.get('type')
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')

  const defaultNext = typeParam === 'recovery' ? '/reset-password' : '/auth/confirmed'
  const safeNext = sanitizeNextPath(nextParam, defaultNext)
  const isRecovery = typeParam === 'recovery' || safeNext === '/reset-password'

  const supabase = await createServerSupabaseClient()
  let verified = false

  if (tokenHash && typeParam && VALID_OTP_TYPES.has(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash: tokenHash,
    })

    if (!error) {
      verified = true
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      verified = true
    }
  }

  if (verified) {
    if (isRecovery) {
      const target = request.nextUrl.clone()
      target.pathname = '/reset-password'
      target.search = ''
      return NextResponse.redirect(target)
    }

    await supabase.auth.signOut()

    const target = request.nextUrl.clone()
    target.pathname = '/auth/confirmed'
    target.search = ''
    return NextResponse.redirect(target)
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = '?error=confirmation_failed'
  return NextResponse.redirect(loginUrl)
}
