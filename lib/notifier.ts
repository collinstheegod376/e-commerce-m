import 'server-only'
import { formatLagosDate, formatNaira, formatShippingAddress } from '@/lib/money'
import { escapeTelegramHtml, sendTelegram } from '@/lib/telegram'
import type { FullOrder } from '@/lib/notifier.stub'

export type { FullOrder, FullOrderItem } from '@/lib/notifier.stub'

function resolveCustomerName(order: FullOrder): string {
  const fromUser = order.user?.name?.trim()
  if (fromUser) return fromUser
  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const addr = order.shippingAddress as Record<string, unknown>
    if (typeof addr.fullName === 'string' && addr.fullName.trim()) return addr.fullName.trim()
    if (typeof addr.name === 'string' && addr.name.trim()) return addr.name.trim()
  }
  return order.customerEmail.split('@')[0] || 'Customer'
}

function resolveCustomerPhone(order: FullOrder): string {
  return order.customerPhone?.trim() || order.user?.phone?.trim() || ''
}

export const notifier = {
  /**
   * Sends the formatted paid order alert to Telegram plus a second short
   * copy-friendly message containing only the customer's phone number.
   * Never throws.
   */
  async notifyPaidOrder(order: FullOrder): Promise<void> {
    try {
      const totalFormatted = formatNaira(order.totalKobo, { showDecimals: true })
      const name = escapeTelegramHtml(resolveCustomerName(order))
      const email = escapeTelegramHtml(order.customerEmail)
      const phone = resolveCustomerPhone(order)
      const phoneDisplay = escapeTelegramHtml(phone || 'No phone')
      const address = escapeTelegramHtml(formatShippingAddress(order.shippingAddress))
      const paidAt = escapeTelegramHtml(formatLagosDate(order.paidAt ?? new Date()))
      const ref = escapeTelegramHtml(order.reference)

      const itemsLines = order.items
        .map((item) => {
          const lineTotal = formatNaira(item.unitPriceKobo * item.qty, { showDecimals: true })
          const prodName = escapeTelegramHtml(item.productNameSnap)
          const size = escapeTelegramHtml(item.sizeSnap)
          return `  • ${prodName} (${size}) × ${item.qty} — ${lineTotal}`
        })
        .join('\n')

      const message = [
        `💰 <b>New paid order</b> — ${totalFormatted} (ref: ${ref})`,
        `👤 ${name} · ${email} · ${phoneDisplay}`,
        `📦 Items:`,
        itemsLines || '  • (no line items)',
        `🚚 Deliver to: ${address}`,
        `🕒 ${paidAt}`,
      ].join('\n')

      console.info(
        JSON.stringify({
          event: 'notifier.paid_order.dispatch',
          reference: order.reference,
          totalKobo: order.totalKobo,
        }),
      )

      await sendTelegram(message)

      // Second short message: copy-friendly phone number so admin can tap to call
      if (phone) {
        await sendTelegram(escapeTelegramHtml(phone))
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          event: 'notifier.paid_order.error',
          reference: order.reference,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    }
  },

  /**
   * Sends a failed payment alert to Telegram. Never throws.
   */
  async notifyFailedOrder(order: FullOrder): Promise<void> {
    try {
      const totalFormatted = formatNaira(order.totalKobo, { showDecimals: true })
      const name = escapeTelegramHtml(resolveCustomerName(order))
      const email = escapeTelegramHtml(order.customerEmail)
      const phoneDisplay = escapeTelegramHtml(resolveCustomerPhone(order) || 'No phone')
      const ref = escapeTelegramHtml(order.reference)

      const message = [
        `⚠️ <b>Failed payment</b> — ref: ${ref}`,
        `👤 ${name} · ${email} · ${phoneDisplay}`,
        `Total: ${totalFormatted}`,
      ].join('\n')

      console.info(
        JSON.stringify({
          event: 'notifier.failed_order.dispatch',
          reference: order.reference,
          totalKobo: order.totalKobo,
        }),
      )

      await sendTelegram(message)
    } catch (err) {
      console.error(
        JSON.stringify({
          event: 'notifier.failed_order.error',
          reference: order.reference,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    }
  },

  /**
   * Sends an arbitrary HTML string to the admin Telegram chat. Never throws.
   */
  async sendTelegramRaw(text: string): Promise<void> {
    try {
      await sendTelegram(text)
    } catch (err) {
      console.error(
        JSON.stringify({
          event: 'notifier.telegram_raw.error',
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    }
  },
}
