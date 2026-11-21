# README-AUTH — Authentication, Middleware & Profiles (Agent 2)

## 1. Security Model (NO GUEST MODE)

- `middleware.ts` runs on every non-static request, refreshes the Supabase session cookie via `@supabase/ssr`, and enforces authentication across the entire storefront.
- **Public routes:** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/api/auth/*`, `/api/paystack/webhook`, `/api/pages/*`, `/_next/*`, `/assets/*`, `/fonts/*`, `/favicon.*`.
- **Authenticated routes:** All other pages redirect to `/login?next=<path>`; API routes return `401 { error, code: 'UNAUTHORIZED' }`.
- **Admin routes:** `/admin/*` and `/api/admin/*` require an active session **and** `profiles.role === 'admin'`; non-admins are redirected to `/` (pages) or receive `403 { error, code: 'FORBIDDEN' }` (API).

## 2. Supabase Dashboard URL Configuration (Required)

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to your production URL (or `http://localhost:3000` locally).
2. Add the following to **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/reset-password`
   - `https://<your-domain>/auth/confirm`
   - `https://<your-domain>/reset-password`

3. In **Authentication → Email Templates**, ensure the **Confirm signup** and **Reset password** links point to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
   ```

## 3. Rate Limiting

`/api/auth/signup`, `/api/auth/signin`, `/api/auth/forgot-password`, and `/api/auth/reset-password` enforce **5 requests/minute** keyed by client IP + email via `lib/rate-limit.ts`.
- Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` + `KV_REST_API_TOKEN`) for distributed serverless rate limiting.
- Without Redis/KV env vars, `lib/rate-limit.ts` automatically falls back to a process-local `Map` (**best-effort only** in serverless deployments).

## 4. Handoffs Published

- `lib/auth.ts`:
  - `getUser()` → `Promise<Profile | null>`
  - `requireUser(nextPath?)` → `Promise<Profile>` (Server Component redirect guard)
  - `requireAdmin()` → `Promise<Profile>` (Server Component admin guard)
  - `requireApiUser()` → `Promise<Profile>` (Route Handler 401 guard)
  - `requireApiAdmin()` → `Promise<Profile>` (Route Handler 401/403 guard — first line of every `/api/admin/*` handler)
- **Agent 4:** Call `requireApiUser()` on every `/api/checkout/*` and `/api/orders/*` route.
- **Agent 6:** Role checks are active in `middleware.ts`, `requireAdmin()`, and `requireApiAdmin()`. Agent 2 never promotes roles via `/api/profile`.
