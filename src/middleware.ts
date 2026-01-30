import { type NextRequest, NextResponse } from 'next/server'

// Security headers for all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Main domains that are NOT custom domains
const MAIN_DOMAINS = [
  'localhost',
  'pagelink.com',
  'www.pagelink.com',
  'pagelink.vercel.app',
]

// Check if the host is a custom domain
function isCustomDomain(host: string): boolean {
  const hostname = host.split(':')[0] // Remove port if present
  return !MAIN_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle custom domain routing
  if (isCustomDomain(host) && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    // Rewrite custom domain requests to the custom domain handler
    // The handler will look up which document/workspace this domain maps to
    const url = request.nextUrl.clone()
    url.pathname = `/api/custom-domain${pathname === '/' ? '' : pathname}`
    url.searchParams.set('_host', host)

    // Rewrite to the custom domain API which will serve the content
    const response = NextResponse.rewrite(url)

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // Create response and add security headers
  const response = NextResponse.next()

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
