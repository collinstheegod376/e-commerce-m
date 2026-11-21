# README-CATALOG — Catalog, Cart & Storefront (Agent 3)

## 1. Storefront Routes

- `/` — Maison Kriss flagship showcase (preserving interactive 3D `.glb` `<model-viewer>` for `maison-kriss-tank-top` and `maison-kriss-jorts`) plus the full active product grid with per-card sizes, stock indicators, and search filter.
- `/products/[slug]` — Product detail view with interactive 3D toggle (when available), gallery thumbnails, `<SizeSelector>`, `<QtyStepper>`, and `<AddToCart>`.
- `/cart` — Live database-backed cart (`<CartLine>`), quantity stepper, remove action, Naira subtotal, delivery summary, and Checkout button (`POST /api/checkout/initialize`).
- `/story` — Markdown rendered from `Page.slug = 'story'` via `<MarkdownContent>`.
- `/contact` — Markdown rendered from `Page.slug = 'contact'` + support contacts from env (`SUPPORT_EMAIL`, `SUPPORT_PHONE`, `SUPPORT_WHATSAPP`).

## 2. Stock Display Rules

- `stockQty === null` → always available (untracked).
- `stockQty === 0` → `"Out of stock"`, size button and Add-to-Cart disabled; API rejects with `400 OUT_OF_STOCK`.
- `0 < stockQty < 5` → `"Only N left"` warning; API rejects quantities exceeding `stockQty` with `400 INSUFFICIENT_STOCK`.

## 3. Handoffs Published for Agent 4

- **Exact Cart JSON shape** (`GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/[id]`, `DELETE /api/cart/items/[id]`):
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "variantId": "uuid",
        "qty": 2,
        "size": "M",
        "unitPriceKobo": 9500000,
        "stockQty": 14,
        "product": {
          "id": "uuid",
          "slug": "urban-legacy-hoodie",
          "name": "Urban Legacy Hoodie",
          "image": "/assets/hoodie-urban-legacy.jpg"
        }
      }
    ],
    "subtotalKobo": 19000000
  }
  ```
- **Helpers in `lib/cart.ts`:**
  - `getCartResponse(userId: string): Promise<CartResponse>`
  - `resolveVariant(variantId: string): Promise<ResolvedVariant | null>`
  - `resolveVariants(variantIds: string[]): Promise<Map<string, ResolvedVariant>>`
- Agent 3 **never** computes final order totals (shipping/discounts) and **never** decrements stock — those belong exclusively to Agent 4.
