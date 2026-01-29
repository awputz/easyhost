import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// Demo folders for when Supabase isn't configured
const demoFolders = [
  { id: 'demo-1', name: 'Images', path: '/', parent_id: null, color: '#3b82f6', asset_count: 0 },
  { id: 'demo-2', name: 'Documents', path: '/', parent_id: null, color: '#22c55e', asset_count: 0 },
  { id: 'demo-3', name: 'Videos', path: '/', parent_id: null, color: '#f59e0b', asset_count: 0 },
]

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ folders: demoFolders })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ folders: [] })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ folders: [] })
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ folders: [] })
    }

    // Get folders with asset count
    const { data: folders, error } = await supabase
      .from('folders')
      .select(`
        *,
        assets:assets(count)
      `)
      .eq('workspace_id', workspace.id)
      .order('name')

    if (error) {
      console.error('Failed to fetch folders:', error)
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
    }

    // Transform to include asset_count
    const foldersWithCount = (folders || []).map((folder: Record<string, unknown>) => ({
      ...folder,
      asset_count: Array.isArray(folder.assets) ? folder.assets.length : 0,
    }))

    return NextResponse.json({ folders: foldersWithCount })
  } catch (error) {
    console.error('Folders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, parent_id, color } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - return mock folder
      const mockFolder = {
        id: `demo-${Date.now()}`,
        name: name.trim(),
        path: '/',
        parent_id: parent_id || null,
        color: color || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(mockFolder)
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Determine path based on parent
    let path = '/'
    if (parent_id) {
      const { data: parent } = await supabase
        .from('folders')
        .select('path, name')
        .eq('id', parent_id)
        .single()

      if (parent) {
        path = `${parent.path}${parent.name}/`
      }
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        workspace_id: workspace.id,
        parent_id: parent_id || null,
        name: name.trim(),
        path,
        color: color || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 })
      }
      console.error('Failed to create folder:', error)
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
