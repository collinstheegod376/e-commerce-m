'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthEditorialShell } from '@/components/auth/AuthEditorialShell'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not update password. Your reset session may have expired.')
        setSubmitting(false)
        return
      }
      setDone(true)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1200)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthEditorialShell
      kicker="Security / 004"
      headline="New password."
      subcopy="Choose a strong password of at least 8 characters for your Maison Kriss account."
    >
      <form className="flex flex-col" onSubmit={onSubmit}>
        <p className="page-kicker">Set credentials</p>
        <h2>Reset password</h2>

        {error ? (
          <div
            role="alert"
            className="mb-6 border-l-2 border-[#ff5331] bg-[#fff5f2] px-4 py-3 text-sm text-[#030304]"
          >
            {error}
          </div>
        ) : null}

        {done ? (
          <div className="border-l-2 border-[#1f9d55] bg-[#f2fbf5] px-4 py-4 text-sm text-[#030304]">
            Your password has been updated. Redirecting you to Maison Kriss…
          </div>
        ) : (
          <>
            <label>
              <span>New Password</span>
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

            <label>
              <span>Confirm New Password</span>
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </label>

            <button
              className="primary-action disabled:opacity-50"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Updating password…' : 'Update password'}
            </button>
          </>
        )}

        <div className="mt-6 text-xs text-[#6a6a6a]">
          <Link className="underline underline-offset-4 hover:text-[#030304]" href="/login">
            Return to sign in
          </Link>
        </div>
      </form>
    </AuthEditorialShell>
  )
}
