import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Demo mode - just acknowledge the view
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true })
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
      .select('id, workspace_id, asset_id, collection_id, view_count')
      .eq('slug', slug)
      .single()

    if (error || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
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

    // Parse UTM parameters if any
    const url = new URL(request.url)
    const utm_source = url.searchParams.get('utm_source') || null
    const utm_medium = url.searchParams.get('utm_medium') || null
    const utm_campaign = url.searchParams.get('utm_campaign') || null

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
        utm_source,
        utm_medium,
        utm_campaign,
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track view error:', error)
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: true })
  }
}
