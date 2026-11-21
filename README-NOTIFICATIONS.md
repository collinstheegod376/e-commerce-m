# README-NOTIFICATIONS — Telegram & Resend Email (Agent 5)

## 1. Exports for Agent 4 Webhook

```ts
import { notifier } from '@/lib/notifier'
import { emails } from '@/lib/emails'

// Inside POST /api/paystack/webhook after marking order paid:
await Promise.allSettled([
  notifier.notifyPaidOrder(fullOrder),
  emails.sendReceipt(fullOrder),
])

// On failed charge event:
await notifier.notifyFailedOrder(fullOrder)
```

- Every exported method is timeout-bounded (`~2s`) and catches all errors internally — a Telegram or Resend outage will **never** throw or fail the webhook response.
- All currency values use ₦ with commas and 2 decimals; all timestamps render in `Africa/Lagos` (WAT).

### Swapping Between Stub and Real Implementation

`lib/notifier.stub.ts` provides `notifierStub` and `emailsStub` (`console.log` stubs) for offline development. Production code imports directly from `@/lib/notifier` and `@/lib/emails`. If you temporarily want stub behavior during local Agent 4 testing without live tokens, import `{ notifierStub as notifier, emailsStub as emails } from '@/lib/notifier.stub'`.

## 2. Setting Up the Telegram Bot

1. Open Telegram and message **@BotFather**.
2. Run `/newbot`, choose a display name (e.g., `Maison Kriss Orders`) and username ending in `bot`.
3. Copy the HTTP API token into `TELEGRAM_BOT_TOKEN`.
4. Send any message (e.g., `/start` or `hello`) to your new bot from your admin account (or add the bot to your admin ops group).
5. Fetch your `chat_id`:
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
   ```
   Copy `result[0].message.chat.id` into `TELEGRAM_CHAT_ID`.

## 3. Setting Up Resend & Domain Verification

1. Create an account at [resend.com](https://resend.com) and go to **Domains → Add Domain**.
2. Add the DNS records (SPF, DKIM, DMARC) for your sending domain (e.g., `maisonkriss.com`) and wait for **Verified** status.
3. Generate a sending API key under **API Keys** and set `RESEND_API_KEY`.
4. Set `RESEND_FROM` to a verified sender address, e.g. `Maison Kriss <orders@maisonkriss.com>`.

## 4. Testing Locally with `curl`

### Test Telegram directly
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
    \"parse_mode\": \"HTML\",
    \"text\": \"💰 <b>New paid order</b> — ₦95,000.00 (ref: MK-TEST-001)\"
  }"
```

### Test Resend directly
```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"${RESEND_FROM}\",
    \"to\": [\"you@example.com\"],
    \"subject\": \"Your order MK-TEST-001 is confirmed\",
    \"html\": \"<h1>Maison Kriss</h1><p>Order MK-TEST-001 confirmed.</p>\"
  }"
```

### Verify Resilience During Telegram Outage
Temporarily set `TELEGRAM_BOT_TOKEN="invalid-token"` and trigger `notifier.notifyPaidOrder(order)` — the call logs a structured `telegram.http_error` JSON entry and resolves cleanly without throwing.
