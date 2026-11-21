import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_TIMEOUT_MS = 10000

function getPaystackSecretKey(): string | null {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!secret || secret === 'sk_test_replace_me') return null
  return secret
}

export function isPaystackConfigured(): boolean {
  return Boolean(getPaystackSecretKey())
}

/**
 * Generates a unique human-readable Maison Kriss order reference, e.g. MK-2026-A9F3C1.
 */
export function generateOrderReference(prefix = 'MK'): string {
  const year = new Date().getUTCFullYear()
  const suffix = randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${year}-${suffix}`
}

/**
 * Constant-time HMAC-SHA512 Paystack webhook signature verification helper.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = getPaystackSecretKey()
  if (!secret || !signatureHeader) return false

  const expectedHex = createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex')
  const expectedBuf = Buffer.from(expectedHex, 'utf8')
  const receivedBuf = Buffer.from(signatureHeader.trim(), 'utf8')

  if (expectedBuf.length !== receivedBuf.length) {
    return false
  }
  return timingSafeEqual(expectedBuf, receivedBuf)
}

async function paystackFetch<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
): Promise<{ status: boolean; message: string; data?: T }> {
  const secret = getPaystackSecretKey()
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAYSTACK_TIMEOUT_MS)

  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })

    const json = (await res.json().catch(() => ({}))) as {
      status?: boolean
      message?: string
      data?: T
    }

    if (!res.ok || !json.status) {
      return {
        status: false,
        message: json.message || `Paystack request failed with HTTP ${res.status}`,
        data: json.data,
      }
    }

    return {
      status: true,
      message: json.message || 'OK',
      data: json.data,
    }
  } finally {
    clearTimeout(timer)
  }
}

export interface PaystackInitializeResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export async function initializePaystackTransaction(params: {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}): Promise<PaystackInitializeResult> {
  const res = await paystackFetch<{
    authorization_url: string
    access_code: string
    reference: string
  }>('/transaction/initialize', {
    method: 'POST',
    body: {
      email: params.email,
      amount: params.amountKobo,
      currency: 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    },
  })

  if (!res.status || !res.data?.authorization_url) {
    throw new Error(res.message || 'Failed to initialize Paystack transaction.')
  }

  return {
    authorizationUrl: res.data.authorization_url,
    accessCode: res.data.access_code,
    reference: res.data.reference,
  }
}

export interface PaystackVerifyResult {
  status: string
  reference: string
  amount: number
  currency: string
  paidAt: string | null
  id?: number | string
  raw: Record<string, unknown>
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResult | null> {
  const res = await paystackFetch<Record<string, unknown>>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET' },
  )

  if (!res.status || !res.data) {
    return null
  }

  return {
    status: String(res.data.status ?? ''),
    reference: String(res.data.reference ?? reference),
    amount: Number(res.data.amount ?? 0),
    currency: String(res.data.currency ?? 'NGN'),
    paidAt: typeof res.data.paid_at === 'string' ? res.data.paid_at : null,
    id:
      typeof res.data.id === 'number' || typeof res.data.id === 'string'
        ? res.data.id
        : undefined,
    raw: res.data,
  }
}

export interface PaystackRefundResult {
  ok: boolean
  refundReference?: string
  message: string
}

export async function issuePaystackRefund(
  paystackReference: string,
  amountKobo?: number,
): Promise<PaystackRefundResult> {
  if (!isPaystackConfigured()) {
    return {
      ok: false,
      message: 'PAYSTACK_SECRET_KEY is not configured. Add a valid Paystack secret key to issue refunds.',
    }
  }

  try {
    const body: Record<string, unknown> = { transaction: paystackReference }
    if (typeof amountKobo === 'number' && amountKobo > 0) {
      body.amount = amountKobo
    }

    const res = await paystackFetch<{ id?: number | string; status?: string }>('/refund', {
      method: 'POST',
      body,
    })

    if (!res.status) {
      return { ok: false, message: res.message || 'Paystack refund request failed.' }
    }

    return {
      ok: true,
      refundReference: res.data?.id ? String(res.data.id) : paystackReference,
      message: res.message || 'Refund initiated with Paystack.',
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Unexpected Paystack refund error.',
    }
  }
}
