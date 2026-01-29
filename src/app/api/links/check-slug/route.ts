import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    // Validate slug format
    const slugRegex = /^[a-zA-Z0-9_-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'Slug can only contain letters, numbers, hyphens, and underscores',
      })
    }

    // Reserved slugs
    const reservedSlugs = ['admin', 'api', 'dashboard', 'login', 'signup', 'settings', 'help']
    if (reservedSlugs.includes(slug.toLowerCase())) {
      return NextResponse.json({
        available: false,
        reason: 'This slug is reserved',
      })
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - always available except for some demo slugs
      const demoTakenSlugs = ['abc123', 'xyz789']
      return NextResponse.json({
        available: !demoTakenSlugs.includes(slug),
        reason: demoTakenSlugs.includes(slug) ? 'This slug is already taken' : null,
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: existingLink } = await supabase
      .from('short_links')
      .select('id')
      .eq('slug', slug)
      .single()

    return NextResponse.json({
      available: !existingLink,
      reason: existingLink ? 'This slug is already taken' : null,
    })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
