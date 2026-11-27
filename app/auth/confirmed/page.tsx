'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

const REDIRECT_SECONDS = 3
const LOGIN_CONFIRMED_URL = '/login?confirmed=1'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)
  const [progressActive, setProgressActive] = useState(false)

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setProgressActive(true)
    })

    const stepTwoTimer = window.setTimeout(() => {
      setSecondsLeft(2)
    }, 1000)

    const stepOneTimer = window.setTimeout(() => {
      setSecondsLeft(1)
    }, 2000)

    const redirectTimer = window.setTimeout(() => {
      router.replace(LOGIN_CONFIRMED_URL)
    }, REDIRECT_SECONDS * 1000)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(stepTwoTimer)
      window.clearTimeout(stepOneTimer)
      window.clearTimeout(redirectTimer)
    }
  }, [router])

  return (
    <main
      className="relative flex min-h-[100dvh] w-full max-w-full items-center justify-center overflow-x-clip bg-[#01121a] px-4 py-10"
      style={{
        backgroundImage:
          'radial-gradient(circle at 78% 20%, rgba(255, 102, 12, 0.11), transparent 46%), radial-gradient(circle at 20% 82%, rgba(7, 35, 48, 0.92), transparent 55%)',
      }}
    >
      <section
        aria-labelledby="confirmed-heading"
        className="animate-mk-fade-up relative w-full max-w-md rounded-2xl border border-white/12 border-t-2 border-t-[#ff660c] bg-[#041b26] px-6 py-10 text-center shadow-2xl sm:px-10 sm:py-12"
      >
        {/* Top Brand Mark */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#01121a]/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff660c]">
          <span>MK</span>
          <span aria-hidden="true" className="text-white/35">
            ·
          </span>
          <span className="text-slate-200">MAISON KRISS</span>
        </div>

        {/* Heading ABOVE the tick */}
        <h1
          id="confirmed-heading"
          className="mt-6 font-brush text-5xl uppercase leading-none tracking-[0.04em] text-[#f8fafc] sm:text-6xl"
        >
          CONFIRMED
        </h1>

        {/* Huge Animated Orange Tick */}
        <div className="relative mx-auto mt-8 flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#ff660c]/20 blur-xl animate-pulse"
          />
          <span
            aria-hidden="true"
            className="animate-mk-glow absolute inset-1.5 rounded-full border border-[#ff660c]/40"
          />
          <div className="animate-mk-fade-up relative flex h-28 w-28 items-center justify-center rounded-full bg-[#ff660c] text-[#01121a] shadow-[0_0_50px_rgba(255,102,12,0.45)] sm:h-32 sm:w-32">
            <Check className="h-16 w-16 stroke-[3.5] sm:h-20 sm:w-20" aria-hidden="true" />
          </div>
        </div>

        {/* Subcopy */}
        <p className="mx-auto mt-8 max-w-xs text-sm leading-relaxed text-slate-300 sm:text-base">
          Your Maison Kriss account has been verified. You&apos;re ready to sign in.
        </p>

        {/* Live 3-2-1 Countdown + Smooth Progress Bar */}
        <div className="mt-7 space-y-3">
          <p
            aria-live="polite"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
          >
            Redirecting to login in{' '}
            <span className="tabular-nums text-[#ff660c]">{secondsLeft}s</span>…
          </p>
          <div
            role="progressbar"
            aria-label="Redirect countdown"
            aria-valuemin={0}
            aria-valuemax={REDIRECT_SECONDS}
            aria-valuenow={REDIRECT_SECONDS - secondsLeft}
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-[#ff660c]"
              style={{
                width: progressActive ? '100%' : '0%',
                transition: `width ${REDIRECT_SECONDS * 1000}ms linear`,
              }}
            />
          </div>
        </div>

        {/* Manual Fallback Button */}
        <Link
          href={LOGIN_CONFIRMED_URL}
          className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-[#ff660c] px-6 py-4 font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#01121a] transition-all hover:-translate-y-0.5 hover:bg-[#ff7a2e] hover:shadow-[0_10px_25px_rgba(255,102,12,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff660c]"
        >
          Go to Login now →
        </Link>
      </section>
    </main>
  )
}
