import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - Get version history for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoVersions(id))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoVersions(id))
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get versions
    const { data: versions, error } = await supabase
      .from('pagelink_document_versions')
      .select('id, version_number, title, created_at')
      .eq('document_id', id)
      .order('version_number', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json(versions || [])
  } catch (error) {
    console.error('Versions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Restore a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership and get document
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id, html, title')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get the version to restore
    const { data: version } = await supabase
      .from('pagelink_document_versions')
      .select('html, title, version_number')
      .eq('id', versionId)
      .eq('document_id', id)
      .single()

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Get current highest version number
    const { data: latestVersions } = await supabase
      .from('pagelink_document_versions')
      .select('version_number')
      .eq('document_id', id)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = (latestVersions?.[0]?.version_number || 0) + 1

    // Update document with restored content
    await supabase
      .from('pagelink_documents')
      .update({
        html: version.html,
        title: version.title || document.title,
      })
      .eq('id', id)

    // Create a new version entry for this restore
    await supabase.from('pagelink_document_versions').insert({
      document_id: id,
      html: version.html,
      title: `Restored from v${version.version_number}`,
      version_number: nextVersion,
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      html: version.html,
      title: version.title,
    })
  } catch (error) {
    console.error('Version restore error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoVersions(documentId: string) {
  return [
    {
      id: 'v3',
      version_number: 3,
      title: 'Added traction section',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'v2',
      version_number: 2,
      title: 'Updated market size',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'v1',
      version_number: 1,
      title: 'Initial version',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
