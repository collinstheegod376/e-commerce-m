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

function SignupFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNext(searchParams.get('next'))

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = (await res.json()) as {
        error?: string
        needsEmailConfirmation?: boolean
        message?: string
      }

      if (!res.ok) {
        setError(data.error || 'Could not create your account.')
        setSubmitting(false)
        return
      }

      if (data.needsEmailConfirmation) {
        setConfirmMessage(
          data.message || 'Check your email to confirm your account before signing in.',
        )
        setSubmitting(false)
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch {
      setError('Network error while creating your account. Please try again.')
      setSubmitting(false)
    }
  }

  if (confirmMessage) {
    return (
      <div className="flex flex-col">
        <p className="page-kicker">Verification required</p>
        <h2>Check your email</h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">{confirmMessage}</p>
        <p className="mb-8 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/10 px-4 py-3 text-xs leading-relaxed text-slate-200">
          We sent a confirmation link to <strong className="text-[#ff660c]">{email}</strong>. Open
          the email and follow the link to activate your Maison Kriss membership.
        </p>
        <Link className="primary-action text-center" href="/login">
          Return to sign in
        </Link>
      </div>
    )
  }

  return (
    <form className="flex flex-col" onSubmit={onSubmit}>
      <p className="page-kicker">Join the uniform</p>
      <h2>Create account</h2>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/15 px-4 py-3 text-sm text-[#f8fafc]"
        >
          {error}
        </div>
      ) : null}

      <label>
        <span>Full Name</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tunde Adebayo"
        />
      </label>

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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </label>

      <button className="primary-action disabled:opacity-50" type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <div className="mt-6 text-xs text-slate-400">
        <Link className="underline underline-offset-4 transition-colors hover:text-[#ff660c]" href="/login">
          Already a member? Sign in
        </Link>
      </div>
    </form>
  )
}

export default function SignupPage() {
  return (
    <AuthEditorialShell
      kicker="Membership / 002"
      headline="Join the archive."
      subcopy="Create your member account to unlock the Maison Kriss catalog, save delivery addresses, and receive order dispatches."
    >
      <Suspense fallback={<p className="text-sm text-slate-400">Loading sign-up…</p>}>
        <SignupFormInner />
      </Suspense>
    </AuthEditorialShell>
  )
}
