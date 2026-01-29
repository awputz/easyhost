import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

// Generate a random short slug
function generateSlug(length = 7): string {
  return nanoid(length)
}

// Demo mode sample links
const demoLinks = [
  {
    id: 'demo-link-1',
    workspace_id: 'demo-workspace',
    asset_id: 'demo-asset-1',
    collection_id: null,
    slug: 'abc123',
    password_hash: null,
    expires_at: null,
    max_views: null,
    allowed_emails: null,
    view_count: 42,
    last_viewed_at: new Date(Date.now() - 3600000).toISOString(),
    is_active: true,
    created_by: 'demo-user',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    asset: {
      id: 'demo-asset-1',
      filename: 'product-demo.pdf',
      mime_type: 'application/pdf',
      public_path: '/demo/product-demo.pdf',
    },
  },
  {
    id: 'demo-link-2',
    workspace_id: 'demo-workspace',
    asset_id: 'demo-asset-2',
    collection_id: null,
    slug: 'xyz789',
    password_hash: 'hashed',
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    max_views: 100,
    allowed_emails: null,
    view_count: 15,
    last_viewed_at: new Date(Date.now() - 7200000).toISOString(),
    is_active: true,
    created_by: 'demo-user',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    asset: {
      id: 'demo-asset-2',
      filename: 'confidential-report.docx',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      public_path: '/demo/confidential-report.docx',
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'active', 'expired', 'disabled'
    const assetId = searchParams.get('asset_id')

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Return demo links
      let links = [...demoLinks]
      if (assetId) {
        links = links.filter((l) => l.asset_id === assetId)
      }
      return NextResponse.json({ links, total: links.length })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ links: demoLinks, total: demoLinks.length })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ links: [], total: 0 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ links: [], total: 0 })
    }

    const workspaceId = workspace.id as string

    // Build query
    let query = supabase
      .from('short_links')
      .select(`
        *,
        asset:assets(id, filename, mime_type, public_path),
        collection:collections(id, name, slug)
      `, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString())
    } else if (status === 'disabled') {
      query = query.eq('is_active', false)
    }

    // Filter by asset
    if (assetId) {
      query = query.eq('asset_id', assetId)
    }

    const { data: links, count, error } = await query

    if (error) {
      console.error('Failed to fetch links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch links' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      links: links || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Links API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      asset_id,
      collection_id,
      custom_slug,
      password,
      expires_at,
      max_views,
      allowed_emails,
    } = body

    // Validate that either asset_id or collection_id is provided
    if (!asset_id && !collection_id) {
      return NextResponse.json(
        { error: 'Either asset_id or collection_id is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return a mock link
      const slug = custom_slug || generateSlug()
      const newLink = {
        id: `demo-link-${Date.now()}`,
        workspace_id: 'demo-workspace',
        asset_id: asset_id || null,
        collection_id: collection_id || null,
        slug,
        password_hash: password ? 'hashed' : null,
        expires_at: expires_at || null,
        max_views: max_views || null,
        allowed_emails: allowed_emails || null,
        view_count: 0,
        last_viewed_at: null,
        is_active: true,
        created_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json({ link: newLink })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const workspaceId = workspace.id as string

    // Generate or validate slug
    let slug = custom_slug || generateSlug()

    // Check slug availability
    if (custom_slug) {
      const { data: existingLink } = await supabase
        .from('short_links')
        .select('id')
        .eq('slug', custom_slug)
        .single()

      if (existingLink) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    let password_hash = null
    if (password) {
      password_hash = await bcrypt.hash(password, 10)
    }

    // Create the short link
    const { data: link, error } = await supabase
      .from('short_links')
      .insert({
        workspace_id: workspaceId,
        asset_id: asset_id || null,
        collection_id: collection_id || null,
        slug,
        password_hash,
        expires_at: expires_at || null,
        max_views: max_views || null,
        allowed_emails: allowed_emails || null,
        is_active: true,
        created_by: user.id,
      })
      .select(`
        *,
        asset:assets(id, filename, mime_type, public_path),
        collection:collections(id, name, slug)
      `)
      .single()

    if (error) {
      console.error('Failed to create link:', error)
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('Create link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
