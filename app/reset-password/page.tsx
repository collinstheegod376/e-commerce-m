'use client'

import { FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AuthEditorialShell } from '@/components/auth/AuthEditorialShell'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isLoading = submitting || isPending
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
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
        startTransition(() => {
          router.push('/')
          router.refresh()
        })
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
            className="mb-6 rounded-lg border-l-4 border-[#ff660c] bg-[#ff660c]/15 px-4 py-3 text-sm text-[#f8fafc]"
          >
            {error}
          </div>
        ) : null}

        {done ? (
          <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-500/15 px-4 py-4 text-sm text-[#f8fafc]">
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
              className="primary-action flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#01121a]" aria-hidden="true" />
                  <span>Updating password…</span>
                </>
              ) : (
                'Update password'
              )}
            </button>
          </>
        )}

        <div className="mt-6 text-xs text-slate-400">
          <Link className="underline underline-offset-4 transition-colors hover:text-[#ff660c]" href="/login">
            Return to sign in
          </Link>
        </div>
      </form>
    </AuthEditorialShell>
  )
}
