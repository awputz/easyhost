import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(_request: NextRequest) {
  // TODO: Enable Supabase session management once environment is configured
  // import { updateSession } from '@/lib/supabase/middleware'
  // return await updateSession(request)

  // For now, allow all requests through
  return NextResponse.next()
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
