import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ versions: getDemoVersions() })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ versions: getDemoVersions() })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch versions for this asset
    const { data: versions, error } = await supabase
      .from('asset_versions')
      .select('*')
      .eq('asset_id', assetId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Failed to fetch versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json({ versions: versions || [] })
  } catch (error) {
    console.error('Versions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params
    const body = await request.json()
    const { note } = body

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        version: {
          id: 'demo-version-new',
          asset_id: assetId,
          version_number: 2,
          storage_path: 'demo/version-2',
          size_bytes: 1024000,
          note,
          created_at: new Date().toISOString(),
        },
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current asset to copy data
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('storage_path, size_bytes')
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Get latest version number
    const { data: latestVersion } = await supabase
      .from('asset_versions')
      .select('version_number')
      .eq('asset_id', assetId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1

    // Create new version record
    const { data: newVersion, error: versionError } = await supabase
      .from('asset_versions')
      .insert({
        asset_id: assetId,
        version_number: nextVersionNumber,
        storage_path: asset.storage_path,
        size_bytes: asset.size_bytes,
        note,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (versionError) {
      console.error('Failed to create version:', versionError)
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    return NextResponse.json({ version: newVersion })
  } catch (error) {
    console.error('Versions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoVersions() {
  const now = Date.now()
  return [
    {
      id: 'demo-version-1',
      asset_id: 'demo-asset',
      version_number: 1,
      storage_path: 'demo/original',
      size_bytes: 1024000,
      note: 'Initial upload',
      uploaded_by: 'demo-user',
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
