import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_ADMIN_UUID = '00000000-0000-4000-8000-000000000001'

interface SeedVariant {
  size: string
  sku: string
  stockQty: number | null
}

interface SeedProduct {
  slug: string
  name: string
  description: string
  priceKobo: number
  images: string[]
  variants: SeedVariant[]
}

const seedProducts: SeedProduct[] = [
  {
    slug: 'urban-legacy-hoodie',
    name: 'Urban Legacy Hoodie',
    description:
      'Double-layered heavyweight brushed fleece hoodie with electric blue and crimson contrast piping, full-length matte zip, and deep kangaroo utility pockets. Built in Lagos for late hours.',
    priceKobo: 9500000, // ₦95,000.00
    images: ['/assets/hoodie-urban-legacy.jpg'],
    variants: [
      { size: 'S', sku: 'MK-HD-UL-S', stockQty: 8 },
      { size: 'M', sku: 'MK-HD-UL-M', stockQty: 14 },
      { size: 'L', sku: 'MK-HD-UL-L', stockQty: 3 }, // Low stock alert (< 5)
      { size: 'XL', sku: 'MK-HD-UL-XL', stockQty: 6 },
    ],
  },
  {
    slug: 'maison-kriss-tank-top',
    name: 'Maison Kriss Tank Top',
    description:
      'Clean-cut heavyweight cotton athletic tank featuring signature cobalt side panels and a reinforced rib neckline. Relaxed through the body for warm Lagos days and layered nights. Inspectable in interactive 3D.',
    priceKobo: 4200000, // ₦42,000.00
    images: ['/assets/tank-top-maison-kriss.jpg'],
    variants: [
      { size: 'S', sku: 'MK-TT-01-S', stockQty: 10 },
      { size: 'M', sku: 'MK-TT-01-M', stockQty: 2 }, // Low stock alert (< 5)
      { size: 'L', sku: 'MK-TT-01-L', stockQty: 9 },
      { size: 'XL', sku: 'MK-TT-01-XL', stockQty: 5 },
    ],
  },
  {
    slug: 'maison-kriss-jorts',
    name: 'Maison Kriss Jorts',
    description:
      'Longline rigid washed black denim shorts cut below the knee with vertical brush-stroke Maison Kriss branding and reinforced utility pockets. Scanned in 3D so you can inspect every seam before ordering.',
    priceKobo: 6800000, // ₦68,000.00
    images: ['/assets/jorts-maison-kriss-product.jpg', '/assets/jorts-maison-kriss.jpg'],
    variants: [
      { size: 'S', sku: 'MK-JT-01-S', stockQty: 0 }, // Out of stock test case
      { size: 'M', sku: 'MK-JT-01-M', stockQty: 7 },
      { size: 'L', sku: 'MK-JT-01-L', stockQty: 4 }, // Low stock alert (< 5)
      { size: 'XL', sku: 'MK-JT-01-XL', stockQty: 6 },
    ],
  },
  {
    slug: 'truth-seeker-tee',
    name: 'Truth Seeker Graphic Tee',
    description:
      'Oversized heavyweight heather jersey ringer tee featuring high-density plastisol neon drip Truth Seeker typography, drop-shoulder construction, and a contrast black ribbed collar.',
    priceKobo: 5200000, // ₦52,000.00
    images: ['/assets/t-shirt-truth-seeker-v2.jpg', '/assets/t-shirt-truth-seeker.jpg'],
    variants: [
      { size: 'S', sku: 'MK-TS-TR-S', stockQty: 12 },
      { size: 'M', sku: 'MK-TS-TR-M', stockQty: 15 },
      { size: 'L', sku: 'MK-TS-TR-L', stockQty: 11 },
      { size: 'XL', sku: 'MK-TS-TR-XL', stockQty: 2 }, // Low stock alert (< 5)
    ],
  },
  {
    slug: 'nocturne-zip-mask-shell',
    name: 'Nocturne Zip Mask Shell',
    description:
      'Technical storm-grade outer layer with concealed face-shield collar, articulated sleeves, and storm-welt pockets. Engineered for nocturnal transit and sculptural layering.',
    priceKobo: 11500000, // ₦115,000.00
    images: ['/assets/57c8a.png'],
    variants: [
      { size: 'S', sku: 'MK-SH-NC-S', stockQty: 4 }, // Low stock alert (< 5)
      { size: 'M', sku: 'MK-SH-NC-M', stockQty: 8 },
      { size: 'L', sku: 'MK-SH-NC-L', stockQty: 6 },
      { size: 'XL', sku: 'MK-SH-NC-XL', stockQty: 3 },
    ],
  },
  {
    slug: 'lagos-archive-utility-tote',
    name: 'Lagos Archive Utility Tote',
    description:
      'Heavy-canvas modular carryall finished in washed obsidian denim with reinforced webbing handles and interior laptop sleeve. Made-to-order untracked archive essential.',
    priceKobo: 3800000, // ₦38,000.00
    images: ['/assets/jorts-maison-kriss.jpg'],
    variants: [{ size: 'One Size', sku: 'MK-BG-AR-OS', stockQty: null }],
  },
]

const storyMarkdown = `# Maison Kriss — The Archive

Maison Kriss is an independent Nigerian contemporary clothing and object studio born out of Lagos. Every garment is engineered as an everyday uniform: heavyweight natural fabrics, sharp architectural proportions, and functional hardware built to outlast trend cycles.

## 01 / Urban Legacy: Built for Late Hours

Designed around late-night transit and layered utility, the **Urban Legacy Hoodie** pairs a structured heavyweight fleece shell with electric blue and crimson seam piping that catches light without overwhelming the silhouette. Every seam is reinforced for daily rotation — from the full-length metal zip to the deep kangaroo pockets and bold sleeve lettering.

## 02 / Truth Seeker: Neon Drip on Heavyweight Jersey

High-density plastisol ink meets a boxy ringer cut. Built on dense heather jersey with contrast black ribbed collar and cuffs, the **Truth Seeker Tee** balances relaxed drop-shoulder proportions with sharp street typography that holds its edge wash after wash.

## 03 / Denim in 3D

Cut wide through the leg and washed for a lived-in charcoal fade, our longline **Maison Kriss Jorts** bring heavyweight workwear durability to warm-weather proportions. We scan flagship garments into interactive 3D models so members can inspect stitching, silhouette, and drape from every angle before ordering.

---

*Private members-only access. Crafted in small numbered runs in Lagos, Nigeria.*`

const contactMarkdown = `# Client Services & Studio Contact

Every Maison Kriss release is produced in numbered batches and fulfilled directly from our Lagos studio.

## Order & Payment Support

If you need help with sizing, nationwide or international dispatch, or experienced a failed payment during checkout, reach our client concierge team directly using the verified channels below and include your **order reference** (for example, \`MK-2026-XXXX\`).

## Studio Hours

- **Monday – Friday:** 9:00 AM – 6:00 PM WAT (Africa/Lagos)
- **Saturday:** 11:00 AM – 4:00 PM WAT
- **Sunday:** Closed (WhatsApp messages answered Monday morning)

## Dispatch & Delivery

- **Lagos Metro:** Same-day or next business day courier dispatch after payment confirmation.
- **Nationwide Nigeria:** 2–4 business days via tracked express courier.
- **Returns & Exchanges:** Unworn garments with original tags may be exchanged within 7 days of delivery.`

async function main() {
  console.log('[seed] Starting Maison Kriss database seed...')

  for (const item of seedProducts) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        priceKobo: item.priceKobo,
        images: item.images,
        active: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        priceKobo: item.priceKobo,
        images: item.images,
        active: true,
      },
    })

    for (const v of item.variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_size: {
            productId: product.id,
            size: v.size,
          },
        },
        update: {
          sku: v.sku,
          stockQty: v.stockQty,
        },
        create: {
          productId: product.id,
          size: v.size,
          sku: v.sku,
          stockQty: v.stockQty,
        },
      })
    }
  }

  await prisma.page.upsert({
    where: { slug: 'story' },
    update: { title: 'Our Story', content: storyMarkdown },
    create: { slug: 'story', title: 'Our Story', content: storyMarkdown },
  })

  await prisma.page.upsert({
    where: { slug: 'contact' },
    update: { title: 'Contact', content: contactMarkdown },
    create: { slug: 'contact', title: 'Contact', content: contactMarkdown },
  })

  const rawAdmins = process.env.ADMIN_EMAILS ?? 'admin@maisonkriss.com'
  const firstAdminEmail = rawAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .find(Boolean) ?? 'admin@maisonkriss.com'

  await prisma.profile.upsert({
    where: { email: firstAdminEmail },
    update: { role: 'admin', name: 'Maison Kriss Admin' },
    create: {
      id: SEED_ADMIN_UUID,
      email: firstAdminEmail,
      name: 'Maison Kriss Admin',
      role: 'admin',
      phone: process.env.SUPPORT_PHONE ?? '+2348000000000',
    },
  })

  console.log(`[seed] Seeded ${seedProducts.length} products, 2 CMS pages, and admin profile (${firstAdminEmail}).`)
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
