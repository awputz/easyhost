import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get a single asset
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        asset: {
          id,
          filename: 'demo-file.html',
          mime_type: 'text/html',
          size_bytes: 1024,
          public_path: '/demo/demo-file.html',
          is_template: false,
          template_schema: null,
          created_at: new Date().toISOString(),
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

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Get asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update an asset
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        asset: {
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
      'filename',
      'tags',
      'is_public',
      'is_template',
      'template_schema',
      'folder_id',
      'metadata',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Update asset
    const { data: asset, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update asset:', error)
      return NextResponse.json(
        { error: 'Failed to update asset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an asset
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

    // Get asset to delete from storage
    const { data: asset } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .single()

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    await supabase
      .storage
      .from('assets')
      .remove([asset.storage_path])

    // Delete from database
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.id)

    if (error) {
      console.error('Failed to delete asset:', error)
      return NextResponse.json(
        { error: 'Failed to delete asset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
