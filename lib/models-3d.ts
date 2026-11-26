/**
 * Maps Maison Kriss product slugs to editorial metadata
 * preserved from the Maison Kriss storefront design.
 */

export interface ProductEditorialMeta {
  eyebrow: string
  features: string[]
  badge?: string
}

const EDITORIAL_BY_SLUG: Record<string, ProductEditorialMeta> = {
  'maison-kriss-tank-top': {
    eyebrow: 'Essential Streetwear / 01',
    features: ['Heavyweight Cotton', 'Relaxed Cut', 'Reinforced Neckline', 'Everyday Layer'],
    badge: 'New',
  },
  'urban-legacy-hoodie': {
    eyebrow: 'Streetwear Clothing Cyberpunk / 02',
    features: [
      'Double-Layered Design',
      'Secure Kangaroo Pockets',
      'Techwear Functionality',
      'Contrast Seam Piping',
    ],
  },
  'maison-kriss-jorts': {
    eyebrow: 'Denim Uniform / 03',
    features: ['Rigid Washed Denim', 'Longline Silhouette', 'Utility Pockets', 'Built To Last'],
  },
  'truth-seeker-tee': {
    eyebrow: 'Graphic Streetwear / 04',
    features: [
      'Heavyweight Jersey',
      'Truth Seeker Print',
      'Oversized Drop Shoulder',
      'Ribbed Crewneck',
    ],
    badge: 'New',
  },
  'nocturne-zip-mask-shell': {
    eyebrow: 'Technical Outerwear / 05',
    features: ['Concealed Storm Mask', 'Articulated Sleeves', 'Weather Shell', 'Lagos Nocturne'],
  },
  'lagos-archive-utility-tote': {
    eyebrow: 'Archive Object / 06',
    features: ['Washed Obsidian Canvas', 'Reinforced Webbing', 'Laptop Sleeve', 'One Size'],
  },
}

export function getProductEditorialMeta(slug: string, index = 0): ProductEditorialMeta {
  const existing = EDITORIAL_BY_SLUG[slug]
  if (existing) return existing

  return {
    eyebrow: `Maison Kriss Archive / ${String(index + 1).padStart(2, '0')}`,
    features: ['Lagos Studio Cut', 'Heavyweight Craft', 'Small Batch Run', 'Members Exclusive'],
  }
}
