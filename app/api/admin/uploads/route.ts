import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAdmin } from '@/lib/auth'
import { ApiError, handleRouteError } from '@/lib/http'

const BUCKET_NAME = 'product-images'
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function createStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError(
      500,
      'Supabase storage is not configured on the server.',
      'STORAGE_NOT_CONFIGURED',
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function ensureProductImagesBucket(supabase: ReturnType<typeof createStorageAdminClient>) {
  const { data: existingBucket, error: getError } = await supabase.storage.getBucket(BUCKET_NAME)

  if (existingBucket && !getError) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_MIME_TO_EXT),
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new ApiError(
      500,
      `Could not initialize product-images storage bucket: ${createError.message}`,
      'STORAGE_BUCKET_ERROR',
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin()

    const formData = await request.formData()
    const fileEntry = formData.get('file')

    if (!(fileEntry instanceof File)) {
      throw new ApiError(400, 'An image file is required under the "file" field.', 'MISSING_FILE')
    }

    const ext = ALLOWED_MIME_TO_EXT[fileEntry.type]
    if (!ext) {
      throw new ApiError(
        400,
        'Unsupported image format. Upload JPEG, PNG, WebP, or AVIF.',
        'INVALID_MIME_TYPE',
      )
    }

    if (fileEntry.size <= 0) {
      throw new ApiError(400, 'Uploaded image file is empty.', 'EMPTY_FILE')
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      throw new ApiError(400, 'Image exceeds the 8MB maximum file size.', 'FILE_TOO_LARGE')
    }

    const supabase = createStorageAdminClient()
    await ensureProductImagesBucket(supabase)

    const objectPath = `products/${Date.now()}-${randomUUID()}.${ext}`
    const buffer = Buffer.from(await fileEntry.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, buffer, {
        contentType: fileEntry.type,
        upsert: false,
      })

    if (uploadError) {
      throw new ApiError(
        500,
        `Failed to upload image: ${uploadError.message}`,
        'STORAGE_UPLOAD_ERROR',
      )
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath)

    if (!publicUrlData?.publicUrl) {
      throw new ApiError(500, 'Could not resolve public URL for uploaded image.', 'PUBLIC_URL_ERROR')
    }

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'admin/uploads:POST')
  }
}
