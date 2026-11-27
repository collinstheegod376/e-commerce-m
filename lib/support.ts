export interface SupportConfig {
  email: string
  phone: string
  whatsapp: string
  siteUrl: string
  flatShippingKobo: number
}

export function getSupportConfig(): SupportConfig {
  const shippingRaw = Number(process.env.FLAT_SHIPPING_KOBO ?? '0')
  return {
    email: process.env.SUPPORT_EMAIL || 'support@maisonkriss.shop',
    phone: process.env.SUPPORT_PHONE || '+2348000000000',
    whatsapp: process.env.SUPPORT_WHATSAPP || '+2348000000000',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    flatShippingKobo: Number.isFinite(shippingRaw) && shippingRaw >= 0 ? Math.round(shippingRaw) : 0,
  }
}

export function sanitizeWhatsappNumber(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

export interface SupportLinks {
  whatsappUrl: string
  mailtoUrl: string
  telUrl: string
  whatsappDisplay: string
  emailDisplay: string
  phoneDisplay: string
}

export function buildPaymentFailureSupportLinks(
  reference?: string,
  config: SupportConfig = getSupportConfig(),
): SupportLinks {
  const refLabel = reference?.trim() || 'MK-ORDER-REF'
  const waNumber = sanitizeWhatsappNumber(config.whatsapp)
  const waText = encodeURIComponent(
    `Hello Maison Kriss support, my payment failed for order reference ${refLabel}. Could you please help me complete it?`,
  )
  const mailSubject = encodeURIComponent(`Payment help for order ${refLabel}`)
  const mailBody = encodeURIComponent(
    `Hello Maison Kriss team,\n\nMy payment failed for order reference: ${refLabel}.\nPlease assist me in resolving this order.\n\nThank you.`,
  )
  const cleanTel = config.phone.replace(/[^+\d]/g, '')

  return {
    whatsappUrl: `https://wa.me/${waNumber}?text=${waText}`,
    mailtoUrl: `mailto:${config.email}?subject=${mailSubject}&body=${mailBody}`,
    telUrl: `tel:${cleanTel}`,
    whatsappDisplay: config.whatsapp,
    emailDisplay: config.email,
    phoneDisplay: config.phone,
  }
}
