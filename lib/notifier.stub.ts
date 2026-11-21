import 'server-only'

/**
 * Shared FullOrder payload type consumed by Agent 5 (notifier + emails)
 * and passed by Agent 4's Paystack webhook handler.
 */
export interface FullOrderItem {
  id?: string
  variantId: string
  productNameSnap: string
  sizeSnap: string
  unitPriceKobo: number
  qty: number
}

export interface FullOrder {
  id: string
  reference: string
  status: string
  subtotalKobo: number
  shippingKobo: number
  totalKobo: number
  customerEmail: string
  customerPhone: string | null
  shippingAddress: unknown
  paidAt: Date | string | null
  createdAt?: Date | string
  user?: {
    name: string | null
    email: string
    phone?: string | null
  } | null
  items: FullOrderItem[]
}

/**
 * Stub implementation of notifier & emails so Agent 4 can integrate & test
 * before live Telegram/Resend credentials are wired up.
 * See README-NOTIFICATIONS.md for swap instructions.
 */
export const notifierStub = {
  async notifyPaidOrder(order: FullOrder): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'notifier.stub.paid_order',
        reference: order.reference,
        totalKobo: order.totalKobo,
        email: order.customerEmail,
        itemCount: order.items.length,
      }),
    )
  },

  async notifyFailedOrder(order: FullOrder): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'notifier.stub.failed_order',
        reference: order.reference,
        totalKobo: order.totalKobo,
        email: order.customerEmail,
      }),
    )
  },

  async sendTelegramRaw(text: string): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'notifier.stub.telegram_raw',
        length: text.length,
      }),
    )
  },
}

export const emailsStub = {
  async sendReceipt(order: FullOrder): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'emails.stub.receipt',
        reference: order.reference,
        to: order.customerEmail,
        totalKobo: order.totalKobo,
      }),
    )
  },
}
