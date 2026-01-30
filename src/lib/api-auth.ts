// API Authentication and Authorization Utilities
import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { rateLimiters, getRateLimitHeaders, RateLimitResult } from '@/lib/rate-limit'

// Error response types
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NOT_CONFIGURED'
  | 'BAD_REQUEST'

// API Error Response structure (for documentation)
// { error: ApiErrorCode, message: string, details?: Record<string, unknown> }

interface AuthContext {
  user: {
    id: string
    email?: string
  }
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>
}

type AuthResult = {
  success: true
  context: AuthContext
} | {
  success: false
  response: NextResponse
}

/**
 * Create a standardized API error response
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  status?: number
): NextResponse {
  const statusMap: Record<ApiErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
    NOT_CONFIGURED: 503,
    BAD_REQUEST: 400,
  }

  return NextResponse.json(
    { error: code, message, ...(details && { details }) },
    { status: status ?? statusMap[code] }
  )
}

/**
 * Authenticate API request and return user context
 */
export async function authenticateRequest(
  request: NextRequest,
  options: {
    required?: boolean
    rateLimitType?: keyof typeof rateLimiters
  } = {}
): Promise<AuthResult> {
  const { required = true, rateLimitType } = options

  // Check rate limit if specified
  if (rateLimitType) {
    const identifier = getRequestIdentifier(request)
    const rateLimitResult = rateLimiters[rateLimitType](identifier)

    if (!rateLimitResult.success) {
      return {
        success: false,
        response: rateLimitedResponse(rateLimitResult),
      }
    }
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    if (required) {
      return {
        success: false,
        response: apiError('NOT_CONFIGURED', 'Authentication not configured'),
      }
    }
    // Return mock context for demo mode
    return {
      success: true,
      context: {
        user: { id: 'demo-user', email: 'demo@example.com' },
        supabase: null as unknown as AuthContext['supabase'],
      },
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      success: false,
      response: apiError('INTERNAL_ERROR', 'Database connection failed'),
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    if (required) {
      return {
        success: false,
        response: apiError('UNAUTHORIZED', 'Authentication required'),
      }
    }
    // Auth not required, but no user
    return {
      success: true,
      context: {
        user: { id: 'anonymous' },
        supabase,
      },
    }
  }

  return {
    success: true,
    context: {
      user: { id: user.id, email: user.email },
      supabase,
    },
  }
}

/**
 * Verify user owns a document
 */
export async function verifyDocumentOwnership(
  supabase: AuthContext['supabase'],
  documentId: string,
  userId: string
): Promise<{ owned: boolean; document?: Record<string, unknown> }> {
  if (!supabase) {
    return { owned: false }
  }

  const { data: document } = await supabase
    .from('pagelink_documents')
    .select('id, user_id, workspace_id')
    .eq('id', documentId)
    .single()

  if (!document) {
    return { owned: false }
  }

  // Check direct ownership
  if (document.user_id === userId) {
    return { owned: true, document }
  }

  // Check workspace membership
  if (document.workspace_id) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', document.workspace_id)
      .eq('user_id', userId)
      .single()

    if (membership && ['admin', 'editor'].includes(membership.role)) {
      return { owned: true, document }
    }
  }

  return { owned: false }
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getRequestIdentifier(request: NextRequest): string {
  // Try to get user ID from headers (set by auth middleware)
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  return 'ip:unknown'
}

/**
 * Create rate limited response
 */
function rateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'RATE_LIMITED',
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  )
}

/**
 * Wrap an API handler with common patterns
 */
export function withApiAuth<T>(
  handler: (request: NextRequest, context: AuthContext, params: T) => Promise<NextResponse>,
  options: {
    required?: boolean
    rateLimitType?: keyof typeof rateLimiters
  } = {}
) {
  return async (request: NextRequest, routeContext: { params: Promise<T> }) => {
    try {
      const params = await routeContext.params
      const authResult = await authenticateRequest(request, options)

      if (!authResult.success) {
        return authResult.response
      }

      return await handler(request, authResult.context, params)
    } catch (error) {
      console.error('API handler error:', error)
      return apiError('INTERNAL_ERROR', 'An unexpected error occurred')
    }
  }
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const data = await request.json() as T
    return { success: true, data }
  } catch {
    return {
      success: false,
      response: apiError('BAD_REQUEST', 'Invalid JSON body'),
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = fields.filter(field => body[field] === undefined || body[field] === null || body[field] === '')

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] }
  }

  return { valid: true }
}
