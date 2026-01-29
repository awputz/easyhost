// Simple in-memory rate limiter for Pagelink

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (consider Redis for production with multiple instances)
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Identifier prefix for namespacing */
  prefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowSeconds, prefix = 'rl' } = config
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  let entry = store.get(key)

  // Create new entry or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  const remaining = Math.max(0, limit - entry.count)
  const success = entry.count <= limit

  return {
    success,
    limit,
    remaining,
    resetAt: entry.resetAt,
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  /**
   * Chat/AI generation - 20 requests per minute
   */
  chat: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 20,
      windowSeconds: 60,
      prefix: 'chat',
    }),

  /**
   * Document creation - 10 requests per hour (free tier)
   */
  documentCreate: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 10,
      windowSeconds: 3600,
      prefix: 'doc_create',
    }),

  /**
   * File upload - 50 requests per minute
   */
  upload: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 50,
      windowSeconds: 60,
      prefix: 'upload',
    }),

  /**
   * General API - 100 requests per minute
   */
  api: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 100,
      windowSeconds: 60,
      prefix: 'api',
    }),

  /**
   * Public view - 1000 requests per minute per document
   */
  publicView: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 1000,
      windowSeconds: 60,
      prefix: 'view',
    }),

  /**
   * Auth attempts - 5 per minute
   */
  auth: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 5,
      windowSeconds: 60,
      prefix: 'auth',
    }),

  /**
   * Password verification - 3 per minute per link
   */
  passwordVerify: (identifier: string) =>
    checkRateLimit(identifier, {
      limit: 3,
      windowSeconds: 60,
      prefix: 'pwd_verify',
    }),
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.success ? {} : { 'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString() }),
  }
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  )
}
