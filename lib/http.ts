import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiErrorBody {
  error: string
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function jsonError(
  status: number,
  error: string,
  code?: string,
  headers?: HeadersInit,
) {
  const body: ApiErrorBody = code ? { error, code } : { error }
  return NextResponse.json(body, headers ? { status, headers } : { status })
}

export function handleRouteError(err: unknown, context?: string) {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.code)
  }

  if (err instanceof ZodError) {
    const first = err.issues[0]
    const path = first?.path?.length ? `${first.path.join('.')}: ` : ''
    return jsonError(400, `${path}${first?.message ?? 'Invalid request payload'}`, 'VALIDATION_ERROR')
  }

  // Handle Prisma unique constraint / record not found errors safely without leaking internals
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaCode = (err as { code?: unknown }).code
    if (prismaCode === 'P2002') {
      return jsonError(409, 'A record with that unique value already exists.', 'CONFLICT')
    }
    if (prismaCode === 'P2025') {
      return jsonError(404, 'Requested resource was not found.', 'NOT_FOUND')
    }
  }

  console.error(`[api${context ? `:${context}` : ''}] Unhandled error:`, err)
  return jsonError(500, 'An unexpected server error occurred.', 'INTERNAL_ERROR')
}
