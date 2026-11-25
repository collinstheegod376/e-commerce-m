import 'server-only'
import { Resend } from 'resend'
import { formatLagosDate, formatNaira, formatShippingAddress } from '@/lib/money'
import { getSupportConfig, sanitizeWhatsappNumber } from '@/lib/support'
import type { FullOrder } from '@/lib/notifier.stub'

const RESEND_TIMEOUT_MS = 2500

export type OrderStatusEmailType = 'paid' | 'confirmed' | 'sent_out' | 'delivered'

export interface OrderStatusEmailOptions {
  note?: string
  estimatedDelivery?: string
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildItemRowsHtml(order: FullOrder): string {
  return order.items
    .map((item) => {
      const unitFormatted = formatNaira(item.unitPriceKobo, { showDecimals: true })
      const lineFormatted = formatNaira(item.unitPriceKobo * item.qty, { showDecimals: true })
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#01121a;">
            <strong>${escapeHtml(item.productNameSnap)}</strong><br/>
            <span style="color:#5b6770;font-size:12px;">Size: ${escapeHtml(item.sizeSnap)}</span>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;color:#33414a;">
            ${item.qty}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;color:#01121a;">
            ${escapeHtml(lineFormatted)}<br/>
            <span style="color:#6c7780;font-size:11px;">${escapeHtml(unitFormatted)} ea</span>
          </td>
        </tr>
      `
    })
    .join('')
}

function buildOrderSummaryBlock(order: FullOrder): string {
  const itemRows = buildItemRowsHtml(order)
  const subtotalStr = escapeHtml(formatNaira(order.subtotalKobo, { showDecimals: true }))
  const shippingStr =
    order.shippingKobo > 0
      ? escapeHtml(formatNaira(order.shippingKobo, { showDecimals: true }))
      : 'Complimentary'
  const totalStr = escapeHtml(formatNaira(order.totalKobo, { showDecimals: true }))

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 0;border-bottom:2px solid #01121a;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#5b6770;">Item</th>
          <th align="center" style="padding:8px 8px;border-bottom:2px solid #01121a;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#5b6770;">Qty</th>
          <th align="right" style="padding:8px 0;border-bottom:2px solid #01121a;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#5b6770;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#5b6770;">Subtotal</td>
        <td align="right" style="padding:6px 0;font-size:13px;color:#01121a;">${subtotalStr}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#5b6770;">Shipping</td>
        <td align="right" style="padding:6px 0;font-size:13px;color:#01121a;">${shippingStr}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;border-top:2px solid #01121a;font-size:16px;font-weight:700;color:#01121a;">Total Paid</td>
        <td align="right" style="padding:12px 0 0;border-top:2px solid #01121a;font-size:16px;font-weight:700;color:#01121a;">${totalStr}</td>
      </tr>
    </table>
  `
}

interface EmailTemplateConfig {
  title: string
  eyebrow: string
  headline: string
  statusBadge: string
  introParagraph: string
  stageCalloutTitle: string
  stageCalloutBody: string
  estimatedDelivery?: string
  note?: string
  dateLabel: string
  dateValue: string
}

function buildBrandedOrderEmailHtml(order: FullOrder, config: EmailTemplateConfig): string {
  const support = getSupportConfig()
  const waNumber = sanitizeWhatsappNumber(support.whatsapp)
  const customerName = escapeHtml(
    order.user?.name?.trim() || order.customerEmail.split('@')[0] || 'Client',
  )
  const address = escapeHtml(formatShippingAddress(order.shippingAddress))
  const reference = escapeHtml(order.reference)
  const trackingUrl = `${support.siteUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(order.reference)}/confirmation`

  const etaBlock = config.estimatedDelivery?.trim()
    ? `
      <div style="margin-top:16px;padding:14px 16px;border-left:3px solid #ff660c;background:#fff7f2;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#b84500;font-weight:700;">
          Estimated Delivery
        </div>
        <div style="margin-top:4px;font-size:14px;color:#01121a;font-weight:600;">
          ${escapeHtml(config.estimatedDelivery.trim())}
        </div>
      </div>
    `
    : ''

  const noteBlock = config.note?.trim()
    ? `
      <div style="margin-top:16px;padding:14px 16px;border-left:3px solid #01121a;background:#f4f6f7;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6770;font-weight:700;">
          Studio &amp; Courier Note
        </div>
        <div style="margin-top:4px;font-size:13px;color:#01121a;line-height:1.55;">
          ${escapeHtml(config.note.trim())}
        </div>
      </div>
    `
    : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(config.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f5f6;font-family:Arial,Helvetica,sans-serif;color:#01121a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #d7dde0;">
            <tr>
              <td style="background:#01121a;color:#ffffff;padding:30px 32px;border-bottom:3px solid #ff660c;">
                <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#ff660c;font-weight:700;">
                  ${escapeHtml(config.eyebrow)}
                </div>
                <h1 style="margin:10px 0 0;font-size:27px;letter-spacing:-0.03em;font-weight:700;color:#ffffff;">
                  ${escapeHtml(config.headline)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#01121a;">
                  Hello ${customerName},
                </p>
                <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#3d4a52;">
                  ${config.introParagraph}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8f9;border:1px solid #dfe5e8;margin-bottom:20px;">
                  <tr>
                    <td style="padding:14px 16px;font-size:11px;color:#5b6770;text-transform:uppercase;letter-spacing:0.06em;">
                      Order Number<br/>
                      <strong style="font-size:14px;color:#01121a;text-transform:none;">${reference}</strong>
                    </td>
                    <td style="padding:14px 16px;font-size:11px;color:#5b6770;text-transform:uppercase;letter-spacing:0.06em;text-align:center;">
                      Status<br/>
                      <strong style="font-size:13px;color:#ff660c;text-transform:none;">${escapeHtml(config.statusBadge)}</strong>
                    </td>
                    <td style="padding:14px 16px;font-size:11px;color:#5b6770;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">
                      ${escapeHtml(config.dateLabel)}<br/>
                      <strong style="font-size:13px;color:#01121a;text-transform:none;">${escapeHtml(config.dateValue)}</strong>
                    </td>
                  </tr>
                </table>

                <div style="margin-bottom:22px;padding:16px;border-left:3px solid #ff660c;background:#fff7f2;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#b84500;font-weight:700;">
                    ${escapeHtml(config.stageCalloutTitle)}
                  </div>
                  <div style="margin-top:6px;font-size:13px;color:#01121a;line-height:1.6;">
                    ${config.stageCalloutBody}
                  </div>
                </div>

                ${etaBlock}
                ${noteBlock}

                <div style="margin-top:24px;">
                  ${buildOrderSummaryBlock(order)}
                </div>

                <div style="margin-top:24px;padding:16px;border-left:3px solid #01121a;background:#f6f8f9;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6770;font-weight:700;">
                    Delivery Destination
                  </div>
                  <div style="margin-top:6px;font-size:13px;color:#01121a;line-height:1.55;">
                    ${address}
                  </div>
                </div>

                <div style="margin-top:26px;text-align:center;">
                  <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#01121a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:13px 26px;border-bottom:2px solid #ff660c;">
                    Track Your Order
                  </a>
                </div>

                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e7ea;font-size:12px;color:#5b6770;line-height:1.7;">
                  Need help with your order? Contact Maison Kriss Client Services:<br/>
                  WhatsApp: <a href="https://wa.me/${waNumber}" style="color:#01121a;font-weight:600;">${escapeHtml(support.whatsapp)}</a> ·
                  Email: <a href="mailto:${escapeHtml(support.email)}" style="color:#01121a;font-weight:600;">${escapeHtml(support.email)}</a> ·
                  Phone: ${escapeHtml(support.phone)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildReceiptHtml(order: FullOrder): string {
  const paidDate = formatLagosDate(order.paidAt ?? new Date())
  return buildBrandedOrderEmailHtml(order, {
    title: `Thank you for your Maison Kriss order ${order.reference}`,
    eyebrow: 'Maison Kriss · Lagos',
    headline: 'Thank You for Your Order',
    statusBadge: 'Paid · Waiting for Confirmation',
    introParagraph:
      'Thank you for shopping with Maison Kriss. Your payment has been received and verified. Your order is now <strong>Paid</strong> and <strong>Waiting for Confirmation</strong> from our Lagos studio.',
    stageCalloutTitle: 'What Happens Next',
    stageCalloutBody:
      'Our Lagos studio team is reviewing your order details and verifying your pieces. You will receive another email as soon as your order is confirmed and again once it has been sent out for delivery.',
    dateLabel: 'Paid (WAT)',
    dateValue: paidDate,
  })
}

function getStatusUpdateEmailSpec(
  order: FullOrder,
  newStatus: OrderStatusEmailType,
  opts?: OrderStatusEmailOptions,
): { subject: string; html: string } {
  const updatedDate = formatLagosDate(new Date())

  if (newStatus === 'paid') {
    return {
      subject: `Thank you for your Maison Kriss order ${order.reference}`,
      html: buildBrandedOrderEmailHtml(order, {
        title: `Thank you for your Maison Kriss order ${order.reference}`,
        eyebrow: 'Maison Kriss · Lagos',
        headline: 'Thank You for Your Order',
        statusBadge: 'Paid · Waiting for Confirmation',
        introParagraph:
          'Thank you for your order with Maison Kriss. Your payment has been verified and your order is now <strong>Paid</strong> and <strong>Waiting for Confirmation</strong> from our Lagos studio.',
        stageCalloutTitle: 'Current Stage: Paid & Waiting for Confirmation',
        stageCalloutBody:
          'Our Lagos studio team is reviewing your order and will confirm it shortly. We will keep you updated at every step.',
        estimatedDelivery: opts?.estimatedDelivery,
        note: opts?.note,
        dateLabel: 'Paid (WAT)',
        dateValue: formatLagosDate(order.paidAt ?? new Date()),
      }),
    }
  }

  if (newStatus === 'confirmed') {
    return {
      subject: `Your Maison Kriss order ${order.reference} is confirmed`,
      html: buildBrandedOrderEmailHtml(order, {
        title: `Your Maison Kriss order ${order.reference} is confirmed`,
        eyebrow: 'Maison Kriss · Order Confirmed',
        headline: 'Your Order Is Confirmed',
        statusBadge: 'Confirmed',
        introParagraph:
          'Great news — our Lagos studio has reviewed and <strong>confirmed</strong> your order. Your pieces are now being carefully prepared and packaged for dispatch.',
        stageCalloutTitle: 'Current Stage: Confirmed & Preparing',
        stageCalloutBody:
          'We are performing final quality checks and packaging your order at our Lagos studio. You will receive a dispatch email the moment your courier picks it up.',
        estimatedDelivery: opts?.estimatedDelivery,
        note: opts?.note,
        dateLabel: 'Updated (WAT)',
        dateValue: updatedDate,
      }),
    }
  }

  if (newStatus === 'sent_out') {
    return {
      subject: `Your Maison Kriss order ${order.reference} has been sent out`,
      html: buildBrandedOrderEmailHtml(order, {
        title: `Your Maison Kriss order ${order.reference} has been sent out`,
        eyebrow: 'Maison Kriss · Dispatched',
        headline: 'Your Order Has Been Sent Out',
        statusBadge: 'Sent Out',
        introParagraph:
          'Your Maison Kriss order has left our Lagos studio and has been <strong>sent out</strong> with our delivery courier.',
        stageCalloutTitle: 'Current Stage: Sent Out for Delivery',
        stageCalloutBody:
          'Your package is on its way to your delivery address. Please keep your phone reachable for our courier.',
        estimatedDelivery: opts?.estimatedDelivery,
        note: opts?.note,
        dateLabel: 'Dispatched (WAT)',
        dateValue: updatedDate,
      }),
    }
  }

  return {
    subject: `Your Maison Kriss order ${order.reference} has been delivered`,
    html: buildBrandedOrderEmailHtml(order, {
      title: `Your Maison Kriss order ${order.reference} has been delivered`,
      eyebrow: 'Maison Kriss · Delivered',
      headline: 'Your Order Has Been Delivered',
      statusBadge: 'Delivered',
      introParagraph:
        'Thank you for choosing Maison Kriss. Your order has been marked as <strong>delivered</strong>. We hope you love your pieces.',
      stageCalloutTitle: 'Current Stage: Delivered',
      stageCalloutBody:
        'If anything about your delivery needs attention, please reach out to Maison Kriss Client Services using the contact details below.',
      estimatedDelivery: opts?.estimatedDelivery,
      note: opts?.note,
      dateLabel: 'Delivered (WAT)',
      dateValue: updatedDate,
    }),
  }
}

async function sendOnce(
  resend: Resend,
  payload: { from: string; to: string; subject: string; html: string },
): Promise<void> {
  const sendPromise = resend.emails.send(payload).then((result) => {
    if (result.error) {
      throw new Error(result.error.message || 'Resend API returned an error')
    }
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Resend request timed out after ${RESEND_TIMEOUT_MS}ms`)),
      RESEND_TIMEOUT_MS,
    )
  })

  await Promise.race([sendPromise, timeoutPromise])
}

async function deliverEmail(
  eventPrefix: string,
  order: FullOrder,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'Maison Kriss <orders@maisonkriss.com>'

  if (!apiKey) {
    console.warn(
      JSON.stringify({
        event: `${eventPrefix}.skipped`,
        reference: order.reference,
        reason: 'Missing RESEND_API_KEY',
      }),
    )
    return
  }

  const resend = new Resend(apiKey)
  const payload = {
    from,
    to: order.customerEmail,
    subject,
    html,
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await sendOnce(resend, payload)
      console.info(
        JSON.stringify({
          event: `${eventPrefix}.sent`,
          reference: order.reference,
          to: order.customerEmail,
          attempt,
        }),
      )
      return
    } catch (err) {
      console.error(
        JSON.stringify({
          event: `${eventPrefix}.error`,
          reference: order.reference,
          to: order.customerEmail,
          attempt,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    }
  }
}

export const emails = {
  /**
   * Sends the initial "Thank you for your order" receipt via Resend.
   * Retries once on transient failure, bounded by timeout, and NEVER throws.
   */
  async sendReceipt(order: FullOrder): Promise<void> {
    await deliverEmail(
      'emails.receipt',
      order,
      `Thank you for your Maison Kriss order ${order.reference}`,
      buildReceiptHtml(order),
    )
  },

  /**
   * Sends a lifecycle status update email (paid, confirmed, sent_out, delivered).
   * Retries once on transient failure, bounded by timeout, and NEVER throws.
   */
  async sendOrderStatusUpdate(
    order: FullOrder,
    newStatus: OrderStatusEmailType,
    opts?: OrderStatusEmailOptions,
  ): Promise<void> {
    const { subject, html } = getStatusUpdateEmailSpec(order, newStatus, opts)
    await deliverEmail(`emails.status.${newStatus}`, order, subject, html)
  },
}
