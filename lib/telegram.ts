import 'server-only'

const TELEGRAM_TIMEOUT_MS = 2000

export function escapeTelegramHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Sends an HTML-formatted message to the configured Telegram chat.
 * Bounded by a 2s timeout and NEVER throws so webhook processing never fails.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn(
      JSON.stringify({
        event: 'telegram.skipped',
        reason: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
      }),
    )
    return
  }

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS)

  try {
    const fetchPromise = fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Telegram request timed out after ${TELEGRAM_TIMEOUT_MS}ms`)),
        TELEGRAM_TIMEOUT_MS + 50,
      )
    })

    const res = await Promise.race([fetchPromise, timeoutPromise])
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      console.error(
        JSON.stringify({
          event: 'telegram.http_error',
          status: res.status,
          body: bodyText.slice(0, 500),
        }),
      )
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'telegram.network_error',
        message: err instanceof Error ? err.message : String(err),
      }),
    )
  } finally {
    clearTimeout(timeoutHandle)
  }
}
