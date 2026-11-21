'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
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
      // Always display the exact same success message regardless of whether the email exists
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
            className="mb-6 border-l-2 border-[#ff5331] bg-[#fff5f2] px-4 py-3 text-sm text-[#030304]"
          >
            {error}
          </div>
        ) : null}

        {submitted ? (
          <div className="mb-6 border-l-2 border-[#030304] bg-[#f7f7f5] px-4 py-4 text-sm leading-relaxed text-[#030304]">
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
              className="primary-action disabled:opacity-50"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Sending link…' : 'Send reset link'}
            </button>
          </>
        )}

        <div className="mt-6 text-xs text-[#6a6a6a]">
          <Link className="underline underline-offset-4 hover:text-[#030304]" href="/login">
            ← Back to sign in
          </Link>
        </div>
      </form>
    </AuthEditorialShell>
  )
}
