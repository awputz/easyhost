import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Demo mode
    if (!isSupabaseConfigured()) {
      // Demo short links
      const demoLinks: Record<string, {
        id: string
        slug: string
        is_active: boolean
        expires_at: string | null
        max_views: number | null
        view_count: number
        password_protected: boolean
        target_url: string
        target_name: string
        target_type: 'asset' | 'collection'
      }> = {
        'abc123': {
          id: 'demo-link-1',
          slug: 'abc123',
          is_active: true,
          expires_at: null,
          max_views: null,
          view_count: 42,
          password_protected: false,
          target_url: '/demo/product-demo.pdf',
          target_name: 'product-demo.pdf',
          target_type: 'asset',
        },
        'xyz789': {
          id: 'demo-link-2',
          slug: 'xyz789',
          is_active: true,
          expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
          max_views: 100,
          view_count: 15,
          password_protected: true,
          target_url: '/demo/confidential-report.docx',
          target_name: 'confidential-report.docx',
          target_type: 'asset',
        },
        'demo': {
          id: 'demo-link-3',
          slug: 'demo',
          is_active: true,
          expires_at: null,
          max_views: null,
          view_count: 100,
          password_protected: false,
          target_url: '/dashboard',
          target_name: 'Demo Dashboard',
          target_type: 'asset',
        },
      }

      const link = demoLinks[slug]
      if (!link) {
        return NextResponse.json(
          { error: 'Link not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(link)
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Fetch the link with related asset/collection data
    const { data: link, error } = await supabase
      .from('short_links')
      .select(`
        *,
        asset:assets(id, filename, public_path, mime_type),
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

    // Determine target URL and name
    let target_url = ''
    let target_name = ''
    let target_type: 'asset' | 'collection' = 'asset'

    if (link.asset) {
      target_url = link.asset.public_path
      target_name = link.asset.filename
      target_type = 'asset'
    } else if (link.collection) {
      target_url = `/c/${link.collection.slug}`
      target_name = link.collection.name
      target_type = 'collection'
    }

    return NextResponse.json({
      id: link.id,
      slug: link.slug,
      is_active: link.is_active,
      expires_at: link.expires_at,
      max_views: link.max_views,
      view_count: link.view_count,
      password_protected: !!link.password_hash,
      target_url,
      target_name,
      target_type,
    })
  } catch (error) {
    console.error('Short link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
