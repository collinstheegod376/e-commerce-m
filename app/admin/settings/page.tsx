import Link from 'next/link'
import { formatNaira } from '@/lib/money'
import { getSupportConfig } from '@/lib/support'

export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  const config = getSupportConfig()

  const envStatus = [
    { label: 'Supabase Auth & DB', configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.DATABASE_URL) },
    { label: 'Paystack Secret Key', configured: Boolean(process.env.PAYSTACK_SECRET_KEY) },
    { label: 'Telegram Bot Notifications', configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) },
    { label: 'Resend Transactional Email', configured: Boolean(process.env.RESEND_API_KEY) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Read-Only Environment Configuration
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">Settings</h1>
        <p className="mt-1 text-xs text-[#6a6a6a]">
          Values below are loaded from Vercel / server environment variables and shown to customers
          on Contact, Receipts, and Payment Failure screens. Secrets are never displayed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border border-[#e2e2de] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
              Customer Support Contacts
            </h2>
            <Link
              href="/admin/support-links"
              className="text-xs underline underline-offset-4 hover:text-[#ff5331]"
            >
              Test failure links →
            </Link>
          </div>

          <dl className="divide-y divide-[#f0f0ec] text-xs">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#6a6a6a]">SUPPORT_EMAIL</dt>
              <dd className="font-mono font-medium text-[#030304]">{config.email}</dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#6a6a6a]">SUPPORT_PHONE</dt>
              <dd className="font-mono font-medium text-[#030304]">{config.phone}</dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#6a6a6a]">SUPPORT_WHATSAPP</dt>
              <dd className="font-mono font-medium text-[#030304]">{config.whatsapp}</dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#6a6a6a]">NEXT_PUBLIC_SITE_URL</dt>
              <dd className="font-mono font-medium text-[#030304]">{config.siteUrl}</dd>
            </div>
          </dl>
        </section>

        <section className="border border-[#e2e2de] bg-white p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em]">
            Shipping &amp; Integrations Status
          </h2>

          <dl className="divide-y divide-[#f0f0ec] text-xs">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#6a6a6a]">Flat Shipping Rate (FLAT_SHIPPING_KOBO)</dt>
              <dd className="font-semibold text-[#030304]">
                {config.flatShippingKobo === 0
                  ? '₦0.00 (Complimentary)'
                  : `${formatNaira(config.flatShippingKobo)} (${config.flatShippingKobo} kobo)`}
              </dd>
            </div>
            {envStatus.map((item) => (
              <div key={item.label} className="py-3 flex justify-between gap-4">
                <dt className="text-[#6a6a6a]">{item.label}</dt>
                <dd
                  className={
                    item.configured
                      ? 'font-medium text-emerald-700'
                      : 'font-medium text-amber-700'
                  }
                >
                  {item.configured ? 'Configured' : 'Not set'}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
