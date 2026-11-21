# README-ADMIN — Admin Dashboard & Analytics (Agent 6)

## 1. Access Control (Defense in Depth)

1. `middleware.ts` gates `/admin/*` and `/api/admin/*` on session + `role === 'admin'`.
2. `app/admin/layout.tsx` calls `requireAdmin()` in the Server Component.
3. Every `/api/admin/*` Route Handler calls `await requireApiAdmin()` as its first statement.
4. `PATCH /api/admin/users/[id]` explicitly forbids self-demotion (`SELF_DEMOTION_FORBIDDEN`), and the UI disables the toggle on the logged-in admin's own profile.
5. `DELETE /api/admin/products/[id]` performs a soft delete (`active = false`) — products are never hard-deleted.

## 2. Admin Pages

| Route | Purpose |
|---|---|
| `/admin` | Overview KPIs (Revenue, Orders, Users, AOV, Success Rate), Recharts Revenue Line (`7d/30d/90d/all`), Orders Bar, Payment Outcomes Donut, Top Products, Size Distribution, Low Stock Alerts (`stockQty < 5`), Recent 10 Orders |
| `/admin/orders` | Paginated orders table (25/page) with status filter and ref/email search |
| `/admin/orders/[id]` | Full order detail, snapshots, customer info, payment/audit event timeline, confirmation-dialog actions |
| `/admin/users` | Paginated users list (25/page) with search, order counts, and total paid spend |
| `/admin/users/[id]` | User profile, order history, safe role toggle |
| `/admin/products` | Paginated catalog incl. inactive items, activate/deactivate toggle |
| `/admin/products/new` | Create product (price entered in Naira, converted to kobo server-side) + auto-slug + initial variants |
| `/admin/products/[id]` | Edit product details + live variant add/edit/remove |
| `/admin/content` | Markdown editors with live preview for `/story` and `/contact` |
| `/admin/support-links` | Test the exact WhatsApp, `mailto:`, and `tel:` links shown to customers on payment failure |
| `/admin/settings` | Read-only display of support contacts and shipping config from env (no secrets shown) |

## 3. Handoffs to Peer Agents

- **Agent 4 (Checkout & Orders):** Admin UI enforces the following Order status transitions via `PATCH /api/admin/orders/[id]`:
  - `paid` → `fulfilled`
  - `pending` or `failed` → `cancelled`
  - `paid` or `fulfilled` → `refunded` (invokes `issuePaystackRefund` in `lib/paystack.ts`, currently stubbed with `TODO(HANDOFF-TO-AGENT-4)`)
  - Every admin transition writes an audit record into `payment_events` (`type = 'admin.order.<status>'`) inside the same Prisma transaction.
- **Agent 1 (Database):** No additional tables were required — admin status transitions reuse `payment_events` with `paystackEventId = "admin:<status>:<orderId>:<uuid>"`. Analytics queries in `lib/admin-analytics.ts` treat `status IN ('paid', 'fulfilled')` as realized revenue so fulfilling a paid order preserves revenue totals.
