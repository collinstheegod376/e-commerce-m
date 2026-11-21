import Link from 'next/link'

interface AuthEditorialShellProps {
  kicker: string
  headline: string
  subcopy: string
  children: React.ReactNode
}

export function AuthEditorialShell({
  kicker,
  headline,
  subcopy,
  children,
}: AuthEditorialShellProps) {
  return (
    <main className="storefront inner-page">
      <img className="guide-lines" src="/assets/b6522.svg" alt="" />
      <header className="site-header">
        <Link className="wordmark" href="/login">
          Maison Kriss
        </Link>
        <nav className="top-nav" aria-label="Auth navigation">
          <Link href="/login">sign in</Link>
          <Link href="/signup">create account</Link>
          <Link href="/forgot-password">recovery</Link>
        </nav>
        <div className="header-actions">
          <span className="text-xs uppercase tracking-[0.08em] text-[#6a6a6a]">
            Members Only · Lagos
          </span>
        </div>
      </header>

      <section className="page-shell auth-page">
        <div className="auth-editorial">
          <span>{kicker}</span>
          <h1>{headline}</h1>
          <p>{subcopy}</p>
          <div className="auth-figure">
            <img src="/assets/57c8a.png" alt="" />
          </div>
        </div>
        <div className="auth-form">{children}</div>
      </section>
    </main>
  )
}
