# README-DB — Database & Supabase Setup (Agent 1)

## 1. Supabase Connection Strings

In your Supabase Dashboard → **Project Settings → Database → Connection string**:

- **`DATABASE_URL` (Transaction Pooler, port `6543`)** — used at runtime by Next.js / Vercel Functions:
  ```
  postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **`DIRECT_URL` (Direct Connection, port `5432`)** — used **only** by Prisma migrations:
  ```
  postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
  ```

Never point runtime traffic at port `5432` in serverless environments.

## 2. Applying Migrations & RLS

1. Generate Prisma Client:
   ```bash
   pnpm db:generate
   ```
2. Apply Prisma schema migrations against Supabase (uses `DIRECT_URL` automatically):
   ```bash
   pnpm db:deploy
   ```
   (For local iterative development against a dev database: `pnpm db:migrate`.)
3. Apply the Supabase RLS policies, `is_admin()` helper, `auth.users` signup trigger, and product soft-delete trigger (`supabase/migrations/0001_rls.sql`):
   ```bash
   psql "$DIRECT_URL" -f supabase/migrations/0001_rls.sql
   ```
   Or paste `supabase/migrations/0001_rls.sql` into the Supabase SQL Editor and run it.

## 3. Verifying RLS Is Enabled on Every Table

Run in Supabase SQL Editor or `psql "$DIRECT_URL"`:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Every application table (`profiles`, `products`, `product_variants`, `carts`, `cart_items`, `orders`, `order_items`, `payment_events`, `pages`) must show `rowsecurity = t`.

## 4. Seeding the Store

```bash
pnpm db:seed
```

Seeds:
- 6 Maison Kriss products priced in Nigerian Naira (kobo), including 3D-enabled pieces (`maison-kriss-tank-top`, `maison-kriss-jorts`), low-stock variants (`< 5`), one out-of-stock variant (`0`), and an untracked `One Size` archive tote (`stockQty: null`).
- CMS pages for `story` and `contact`.
- Initial admin profile using the first email in `ADMIN_EMAILS`.

## 5. Handoffs to Peer Agents

- **Agent 2 (Auth & Profile):** `public.handle_new_user()` trigger on `auth.users` creates `public.profiles` rows with `role = 'customer'` (or `'admin'` if `app.admin_emails` Postgres GUC is set). Agent 2's `POST /api/auth/signup` and `ensureProfileForAuthUser()` also reconcile `ADMIN_EMAILS` from the Node environment.
- **Agent 4 (Checkout & Webhooks):** `payment_events` columns: `id`, `paystack_event_id` (`@unique`), `order_id`, `type`, `payload` (`Json`), `received_at`. Inserts are restricted to `service_role` (or Prisma server-side); admins have read-only RLS.
- **Agent 6 (Admin Analytics):** Analytics-optimized indexes added on `orders(status, paid_at)`, `orders(user_id)`, `orders(created_at)`, `orders(customer_email)`, `order_items(order_id)`, `order_items(variant_id)`, `order_items(size_snap)`, `product_variants(stock_qty)`, `products(active)`, `profiles(role)`.
- **Schema note:** `Product.orderItems` back-relation was omitted from `prisma/schema.prisma` because `OrderItem` links to `Product` through `ProductVariant` (`order_items.variant_id -> product_variants.product_id`), matching the PART 2 SQL queries cleanly. Snake-case `@map`/`@@map` mappings keep Prisma camelCase properties aligned with the exact Postgres table/column names.
