import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get a single collection with items
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      if (id.startsWith('demo-collection')) {
        return NextResponse.json({
          collection: {
            id,
            name: 'Demo Collection',
            description: 'A sample collection for demonstration',
            slug: 'demo-collection',
            is_public: true,
            layout: 'grid',
            branding: {
              primary_color: '#8b5cf6',
              header_text: 'Demo Collection',
            },
            view_count: 42,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          items: [
            {
              id: 'item-1',
              position: 0,
              custom_title: null,
              asset: {
                id: 'asset-1',
                filename: 'hero-image.png',
                mime_type: 'image/png',
                size_bytes: 245000,
                public_path: '/demo/hero-image.png',
              },
            },
            {
              id: 'item-2',
              position: 1,
              custom_title: 'Product Overview',
              asset: {
                id: 'asset-2',
                filename: 'product-overview.pdf',
                mime_type: 'application/pdf',
                size_bytes: 1250000,
                public_path: '/demo/product-overview.pdf',
              },
            },
          ],
        })
      }
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*, cover_asset:assets!cover_asset_id(id, filename, public_path)')
      .eq('id', id)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get collection items with assets
    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select('*, asset:assets(*)')
      .eq('collection_id', id)
      .order('position', { ascending: true })

    if (itemsError) {
      console.error('Failed to fetch collection items:', itemsError)
    }

    return NextResponse.json({
      collection,
      items: items || [],
    })
  } catch (error) {
    console.error('Get collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a collection
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        collection: {
          id,
          ...body,
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

    // Allowed fields to update
    const allowedFields = [
      'name',
      'description',
      'slug',
      'is_public',
      'layout',
      'branding',
      'cover_asset_id',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Update collection
    const { data: collection, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update collection:', error)
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Update collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if Supabase is configured
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

    // Delete collection (items will be cascade deleted)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.id)

    if (error) {
      console.error('Failed to delete collection:', error)
      return NextResponse.json(
        { error: 'Failed to delete collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
