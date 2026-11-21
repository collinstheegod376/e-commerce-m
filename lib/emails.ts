import 'server-only'
import { Resend } from 'resend'
import { formatLagosDate, formatNaira, formatShippingAddress } from '@/lib/money'
import { getSupportConfig, sanitizeWhatsappNumber } from '@/lib/support'
import type { FullOrder } from '@/lib/notifier.stub'

const RESEND_TIMEOUT_MS = 2500

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildReceiptHtml(order: FullOrder): string {
  const support = getSupportConfig()
  const waNumber = sanitizeWhatsappNumber(support.whatsapp)
  const customerName = escapeHtml(
    order.user?.name?.trim() || order.customerEmail.split('@')[0] || 'Client',
  )
  const paidDate = escapeHtml(formatLagosDate(order.paidAt ?? new Date()))
  const address = escapeHtml(formatShippingAddress(order.shippingAddress))
  const reference = escapeHtml(order.reference)

  const itemRows = order.items
    .map((item) => {
      const unitFormatted = formatNaira(item.unitPriceKobo, { showDecimals: true })
      const lineFormatted = formatNaira(item.unitPriceKobo * item.qty, { showDecimals: true })
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#030304;">
            <strong>${escapeHtml(item.productNameSnap)}</strong><br/>
            <span style="color:#6a6a6a;font-size:12px;">Size: ${escapeHtml(item.sizeSnap)}</span>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:14px;color:#3a3a3a;">
            ${item.qty}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-size:14px;color:#030304;">
            ${escapeHtml(lineFormatted)}<br/>
            <span style="color:#757575;font-size:11px;">${escapeHtml(unitFormatted)} ea</span>
          </td>
        </tr>
      `
    })
    .join('')

  const subtotalStr = escapeHtml(formatNaira(order.subtotalKobo, { showDecimals: true }))
  const shippingStr =
    order.shippingKobo > 0
      ? escapeHtml(formatNaira(order.shippingKobo, { showDecimals: true }))
      : 'Complimentary'
  const totalStr = escapeHtml(formatNaira(order.totalKobo, { showDecimals: true }))

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Order ${reference} Confirmed — Maison Kriss</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f2;font-family:Arial,Helvetica,sans-serif;color:#030304;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #d6d6d6;">
            <tr>
              <td style="background:#030304;color:#ffffff;padding:28px 32px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#aaaaaa;">
                  Maison Kriss · Lagos
                </div>
                <h1 style="margin:8px 0 0;font-size:28px;letter-spacing:-0.04em;font-weight:700;">
                  Order Confirmed
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
                  Hello ${customerName},
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#4a4a4a;">
                  Thank you for your order. Your payment has been confirmed and our Lagos studio is preparing your pieces for dispatch.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f5;border:1px solid #e5e5e5;margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 16px;font-size:12px;color:#6a6a6a;text-transform:uppercase;">
                      Reference<br/>
                      <strong style="font-size:14px;color:#030304;text-transform:none;">${reference}</strong>
                    </td>
                    <td style="padding:14px 16px;font-size:12px;color:#6a6a6a;text-transform:uppercase;text-align:right;">
                      Paid (WAT)<br/>
                      <strong style="font-size:13px;color:#030304;text-transform:none;">${paidDate}</strong>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="padding:8px 0;border-bottom:2px solid #030304;font-size:11px;text-transform:uppercase;color:#6a6a6a;">Item</th>
                      <th align="center" style="padding:8px 8px;border-bottom:2px solid #030304;font-size:11px;text-transform:uppercase;color:#6a6a6a;">Qty</th>
                      <th align="right" style="padding:8px 0;border-bottom:2px solid #030304;font-size:11px;text-transform:uppercase;color:#6a6a6a;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemRows}
                  </tbody>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#6a6a6a;">Subtotal</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#030304;">${subtotalStr}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#6a6a6a;">Shipping</td>
                    <td align="right" style="padding:6px 0;font-size:13px;color:#030304;">${shippingStr}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;border-top:1px solid #030304;font-size:16px;font-weight:700;">Total Paid</td>
                    <td align="right" style="padding:12px 0 0;border-top:1px solid #030304;font-size:16px;font-weight:700;">${totalStr}</td>
                  </tr>
                </table>

                <div style="margin-top:24px;padding:16px;border-left:3px solid #ff5331;background:#f7f7f5;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6a6a6a;">
                    Delivery Destination
                  </div>
                  <div style="margin-top:6px;font-size:13px;color:#030304;line-height:1.55;">
                    ${address}
                  </div>
                </div>

                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#6a6a6a;line-height:1.7;">
                  Need help with your order? Contact Maison Kriss Client Services:<br/>
                  WhatsApp: <a href="https://wa.me/${waNumber}" style="color:#030304;">${escapeHtml(support.whatsapp)}</a> ·
                  Email: <a href="mailto:${escapeHtml(support.email)}" style="color:#030304;">${escapeHtml(support.email)}</a> ·
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

export const emails = {
  /**
   * Sends an order confirmation receipt via Resend.
   * Retries once on transient failure, bounded by timeout, and NEVER throws.
   */
  async sendReceipt(order: FullOrder): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || 'Maison Kriss <orders@maisonkriss.com>'

    if (!apiKey) {
      console.warn(
        JSON.stringify({
          event: 'emails.receipt.skipped',
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
      subject: `Your order ${order.reference} is confirmed`,
      html: buildReceiptHtml(order),
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await sendOnce(resend, payload)
        console.info(
          JSON.stringify({
            event: 'emails.receipt.sent',
            reference: order.reference,
            to: order.customerEmail,
            attempt,
          }),
        )
        return
      } catch (err) {
        console.error(
          JSON.stringify({
            event: 'emails.receipt.error',
            reference: order.reference,
            to: order.customerEmail,
            attempt,
            message: err instanceof Error ? err.message : String(err),
          }),
        )
      }
    }
  },
}
