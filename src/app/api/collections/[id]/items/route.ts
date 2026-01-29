import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Add items to collection
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: collectionId } = await params
    const body = await request.json()
    const { asset_ids, items } = body

    // Can either provide asset_ids (simple add) or items (with custom titles)
    if (!asset_ids && !items) {
      return NextResponse.json(
        { error: 'asset_ids or items array is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      const mockItems = (asset_ids || items.map((i: { asset_id: string }) => i.asset_id)).map(
        (assetId: string, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          collection_id: collectionId,
          asset_id: assetId,
          position: index,
          custom_title: items?.[index]?.custom_title || null,
          created_at: new Date().toISOString(),
        })
      )
      return NextResponse.json({ items: mockItems })
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

    // Verify collection belongs to workspace
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('workspace_id', workspace.id)
      .single()

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get current max position
    const { data: maxPositionResult } = await supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    let nextPosition = (maxPositionResult?.position ?? -1) + 1

    // Prepare items to insert
    const itemsToInsert = (asset_ids || items.map((i: { asset_id: string }) => i.asset_id)).map(
      (assetId: string, index: number) => ({
        collection_id: collectionId,
        asset_id: assetId,
        position: nextPosition + index,
        custom_title: items?.[index]?.custom_title || null,
      })
    )

    // Insert items
    const { data: insertedItems, error } = await supabase
      .from('collection_items')
      .insert(itemsToInsert)
      .select('*, asset:assets(*)')

    if (error) {
      console.error('Failed to add items:', error)
      return NextResponse.json(
        { error: 'Failed to add items to collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items: insertedItems })
  } catch (error) {
    console.error('Add collection items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Reorder items in collection
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: collectionId } = await params
    const body = await request.json()
    const { item_order } = body // Array of item IDs in new order

    if (!item_order || !Array.isArray(item_order)) {
      return NextResponse.json(
        { error: 'item_order array is required' },
        { status: 400 }
      )
    }

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

    // Update positions for each item
    const updates = item_order.map((itemId: string, index: number) =>
      supabase
        .from('collection_items')
        .update({ position: index })
        .eq('id', itemId)
        .eq('collection_id', collectionId)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder collection items error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: collectionId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id is required' },
        { status: 400 }
      )
    }

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

    // Delete item
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)
      .eq('collection_id', collectionId)

    if (error) {
      console.error('Failed to remove item:', error)
      return NextResponse.json(
        { error: 'Failed to remove item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove collection item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
