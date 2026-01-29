import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folderId = searchParams.get('folder_id')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Return empty array for demo mode
      return NextResponse.json({ assets: [], total: 0 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ assets: [], total: 0 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ assets: [], total: 0 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ assets: [], total: 0 })
    }

    const workspaceId = workspace.id as string

    // Build query
    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)

    // Filter by folder
    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    // Search
    if (search) {
      query = query.or(`filename.ilike.%${search}%,original_filename.ilike.%${search}%`)
    }

    // Sort
    const validSortFields = ['created_at', 'filename', 'size_bytes', 'mime_type']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: assets, count, error } = await query

    if (error) {
      console.error('Failed to fetch assets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Assets API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
