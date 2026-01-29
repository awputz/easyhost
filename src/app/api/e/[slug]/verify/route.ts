import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Demo mode
    if (!isSupabaseConfigured()) {
      // Demo password for xyz789 is "demo123"
      if (slug === 'xyz789' && password === 'demo123') {
        return NextResponse.json({
          success: true,
          target_url: '/demo/confidential-report.docx',
        })
      }
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Fetch the link
    const { data: link, error } = await supabase
      .from('short_links')
      .select(`
        *,
        asset:assets(id, filename, public_path),
        collection:collections(id, name, slug)
      `)
      .eq('slug', slug)
      .single()

    if (error || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    // Check if link is active
    if (!link.is_active) {
      return NextResponse.json(
        { error: 'This link has been disabled' },
        { status: 403 }
      )
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired' },
        { status: 410 }
      )
    }

    // Check view limit
    if (link.max_views && link.view_count >= link.max_views) {
      return NextResponse.json(
        { error: 'This link has reached its maximum views' },
        { status: 410 }
      )
    }

    // Verify password
    if (!link.password_hash) {
      return NextResponse.json(
        { error: 'This link is not password protected' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, link.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Increment view count
    await supabase
      .from('short_links')
      .update({
        view_count: link.view_count + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', link.id)

    // Track analytics event
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    await supabase
      .from('analytics_events')
      .insert({
        workspace_id: link.workspace_id,
        asset_id: link.asset_id,
        short_link_id: link.id,
        collection_id: link.collection_id,
        event_type: 'view',
        ip_address: ip,
        user_agent: userAgent,
        referrer,
      })

    // Determine target URL
    let target_url = ''
    if (link.asset) {
      target_url = link.asset.public_path
    } else if (link.collection) {
      target_url = `/c/${link.collection.slug}`
    }

    return NextResponse.json({
      success: true,
      target_url,
    })
  } catch (error) {
    console.error('Password verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
