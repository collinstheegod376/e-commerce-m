'use client'

import { useState } from 'react'
import { buildPaymentFailureSupportLinks, type SupportConfig } from '@/lib/support'

interface SupportLinksTesterProps {
  config: SupportConfig
}

export function SupportLinksTester({ config }: SupportLinksTesterProps) {
  const [reference, setReference] = useState('MK-2026-TEST01')
  const [copied, setCopied] = useState<string | null>(null)

  const links = buildPaymentFailureSupportLinks(reference, config)

  const rows = [
    {
      label: 'WhatsApp Payment Failure Link',
      display: links.whatsappDisplay,
      href: links.whatsappUrl,
      cta: 'Open WhatsApp',
      external: true,
    },
    {
      label: 'Email Payment Failure Link',
      display: links.emailDisplay,
      href: links.mailtoUrl,
      cta: 'Open Mail Client',
      external: false,
    },
    {
      label: 'Direct Phone Call Link',
      display: links.phoneDisplay,
      href: links.telUrl,
      cta: 'Dial Number',
      external: false,
    },
  ]

  async function copyHref(label: string, href: string) {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(label)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      // Ignore clipboard errors in restricted environments
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#e2e2de] bg-white p-6">
        <label className="block max-w-md">
          <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
            Sample Order Reference
          </span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="MK-2026-XXXX"
            className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 font-mono text-xs outline-none focus:border-[#030304]"
          />
        </label>
        <p className="mt-2 text-xs text-[#6a6a6a]">
          Preview and test the exact links rendered to a customer when a Paystack payment fails.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border border-[#e2e2de] bg-white p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
                {row.label}
              </p>
              <p className="mt-1 text-sm font-bold text-[#030304]">{row.display}</p>
              <p className="mt-2 break-all bg-[#f7f7f5] border border-[#e5e5e5] px-3 py-2 font-mono text-[11px] text-[#4a4a4a]">
                {row.href}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyHref(row.label, row.href)}
                className="border border-[#d6d6d6] px-3.5 py-2 text-xs hover:border-[#030304]"
              >
                {copied === row.label ? 'Copied' : 'Copy URL'}
              </button>
              <a
                href={row.href}
                target={row.external ? '_blank' : undefined}
                rel={row.external ? 'noopener noreferrer' : undefined}
                className="bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22]"
              >
                {row.cta}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
