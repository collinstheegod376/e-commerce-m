import { getSupportConfig } from '@/lib/support'
import { SupportLinksTester } from '@/components/admin/SupportLinksTester'

export const dynamic = 'force-dynamic'

export default function AdminSupportLinksPage() {
  const config = getSupportConfig()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
          Payment Failure Recovery Verification
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">
          Generate &amp; Test Support Links
        </h1>
      </div>

      <SupportLinksTester config={config} />
    </div>
  )
}
