import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireApiAdmin } from '@/lib/auth'
import { nairaToKobo } from '@/lib/money'
import { ApiError, handleRouteError } from '@/lib/http'

const PAGE_SIZE = 25

const initialVariantSchema = z.object({
  size: z.string().trim().min(1, 'Size is required').max(40),
  sku: z.string().trim().max(80).nullable().optional(),
  stockQty: z.number().int().min(0).nullable().optional(),
})

const createProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name is required').max(160),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
    description: z.string().trim().max(5000).nullable().optional(),
    priceKobo: z.number().int().min(100, 'Price must be at least ₦1').optional(),
    priceNaira: z.number().positive('Price in Naira must be greater than 0').optional(),
    active: z.boolean().optional(),
    images: z.array(z.string().trim().min(1)).max(12).optional(),
    variants: z.array(initialVariantSchema).max(30).optional(),
  })
  .refine((v) => v.priceKobo !== undefined || v.priceNaira !== undefined, {
    message: 'Provide either priceNaira or priceKobo',
    path: ['priceNaira'],
  })

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin()

    const params = request.nextUrl.searchParams
    const q = params.get('q')?.trim() || ''
    const pageRaw = Number(params.get('page') ?? '1')
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

    const where: Prisma.ProductWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          variants: {
            orderBy: { id: 'asc' },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    })
  } catch (err) {
    return handleRouteError(err, 'admin/products:GET')
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin()
    const body = createProductSchema.parse(await request.json())

    const priceKobo =
      body.priceNaira !== undefined ? nairaToKobo(body.priceNaira) : (body.priceKobo as number)

    if (!Number.isInteger(priceKobo) || priceKobo < 100) {
      throw new ApiError(400, 'Price must be at least ₦1.00 (100 kobo).', 'INVALID_PRICE')
    }

    const variants = (body.variants ?? []).map((v) => ({
      size: v.size,
      sku: v.sku && v.sku.length > 0 ? v.sku : null,
      stockQty: v.stockQty === undefined ? null : v.stockQty,
    }))

    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          priceKobo,
          active: body.active ?? true,
          images: body.images ?? [],
          ...(variants.length > 0
            ? {
                variants: {
                  create: variants,
                },
              }
            : {}),
        },
        include: {
          variants: {
            orderBy: { id: 'asc' },
          },
        },
      })
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'admin/products:POST')
  }
}
