'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthEditorialShell } from '@/components/auth/AuthEditorialShell'

function safeNext(next: string | null): string {
  if (!next) return '/'
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNext(searchParams.get('next'))
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(
    urlError === 'confirmation_failed'
      ? 'Your confirmation or reset link has expired. Please try again.'
      : '',
  )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not sign in. Please check your credentials.')
        setSubmitting(false)
        return
      }
      router.push(nextPath)
      router.refresh()
    } catch {
      setError('Network error while signing in. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col" onSubmit={onSubmit}>
      <p className="page-kicker">Welcome back</p>
      <h2>Sign in</h2>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/15 px-4 py-3 text-sm text-[#f8fafc]"
        >
          {error}
        </div>
      ) : null}

      <label>
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </label>

      <button className="primary-action disabled:opacity-50" type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="mt-6 flex flex-col gap-3 text-xs text-slate-400">
        <Link className="underline underline-offset-4 transition-colors hover:text-[#ff660c]" href="/forgot-password">
          Forgot your password?
        </Link>
        <Link
          className="underline underline-offset-4 transition-colors hover:text-[#ff660c]"
          href={nextPath !== '/' ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
        >
          New to Maison Kriss? Create an account
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthEditorialShell
      kicker="Members / 001"
      headline="Wear it your way."
      subcopy="Private access to the Maison Kriss archive. Sign in to inspect 3D pieces, manage your fit, and reserve numbered drops."
    >
      <Suspense fallback={<p className="text-sm text-slate-400">Loading sign-in…</p>}>
        <LoginFormInner />
      </Suspense>
    </AuthEditorialShell>
  )
}
