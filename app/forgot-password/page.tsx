'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { AuthEditorialShell } from '@/components/auth/AuthEditorialShell'

const NEUTRAL_MESSAGE =
  'If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json()) as { error?: string }
      if (res.status === 429) {
        setError(data.error || 'Too many requests. Please wait a minute.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthEditorialShell
      kicker="Recovery / 003"
      headline="Reset access."
      subcopy="Enter the email registered to your Maison Kriss membership and we will dispatch a secure one-time recovery link."
    >
      <form className="flex flex-col" onSubmit={onSubmit}>
        <p className="page-kicker">Password recovery</p>
        <h2>Forgot password</h2>

        {error ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/15 px-4 py-3 text-sm text-[#f8fafc]"
          >
            {error}
          </div>
        ) : null}

        {submitted ? (
          <div className="mb-6 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/10 px-4 py-4 text-sm leading-relaxed text-[#f8fafc]">
            {NEUTRAL_MESSAGE}
          </div>
        ) : (
          <>
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

            <button
              className="primary-action flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#01121a]" aria-hidden="true" />
                  <span>Sending link…</span>
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </>
        )}

        <div className="mt-6 text-xs text-slate-400">
          <Link className="underline underline-offset-4 transition-colors hover:text-[#ff660c]" href="/login">
            ← Back to sign in
          </Link>
        </div>
      </form>
    </AuthEditorialShell>
  )
}
