import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - List collections
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return sample collections
      return NextResponse.json({
        collections: [
          {
            id: 'demo-collection-1',
            name: 'Product Launch Assets',
            description: 'All assets for Q1 product launch campaign',
            slug: 'product-launch-2024',
            is_public: true,
            layout: 'grid',
            branding: {
              primary_color: '#8b5cf6',
              header_text: 'Product Launch 2024',
            },
            view_count: 145,
            item_count: 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-collection-2',
            name: 'Client Presentation',
            description: 'Materials for Acme Corp presentation',
            slug: 'acme-presentation',
            is_public: false,
            layout: 'list',
            branding: {},
            view_count: 23,
            item_count: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 2,
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ collections: [], total: 0 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ collections: [], total: 0 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ collections: [], total: 0 })
    }

    // Fetch collections with item count
    const { data: collections, count, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items(count)
      `, { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch collections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      )
    }

    // Transform to include item_count
    const transformedCollections = (collections || []).map((c) => ({
      ...c,
      item_count: c.collection_items?.[0]?.count || 0,
    }))

    return NextResponse.json({
      collections: transformedCollections,
      total: count || 0,
    })
  } catch (error) {
    console.error('Collections API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, slug, is_public, layout, branding, cover_asset_id } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return a mock collection
      const demoSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return NextResponse.json({
        collection: {
          id: `demo-${Date.now()}`,
          name,
          description: description || null,
          slug: demoSlug,
          is_public: is_public ?? false,
          layout: layout || 'grid',
          branding: branding || {},
          cover_asset_id: cover_asset_id || null,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
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

    // Generate slug if not provided
    const collectionSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Check if slug is unique within workspace
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('slug', collectionSlug)
      .single()

    if (existingCollection) {
      return NextResponse.json(
        { error: 'A collection with this slug already exists' },
        { status: 400 }
      )
    }

    // Create collection
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        workspace_id: workspace.id,
        name,
        description: description || null,
        slug: collectionSlug,
        is_public: is_public ?? false,
        layout: layout || 'grid',
        branding: branding || {},
        cover_asset_id: cover_asset_id || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create collection:', error)
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
