import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { handleRouteError } from '@/lib/http'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleRouteError(err, 'auth/signout')
  }
}
