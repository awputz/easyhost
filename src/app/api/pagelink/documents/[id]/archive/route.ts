import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// POST - Archive a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, archived: true })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Archive the document by setting archived_at
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, slug, title, archived_at')
      .single()

    if (error) {
      console.error('Error archiving document:', error)
      return NextResponse.json({ error: 'Failed to archive document' }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      archived: true,
      document,
    })
  } catch (error) {
    console.error('Document archive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Restore (unarchive) a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, archived: false })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Restore the document by clearing archived_at
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .update({ archived_at: null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, slug, title, archived_at')
      .single()

    if (error) {
      console.error('Error restoring document:', error)
      return NextResponse.json({ error: 'Failed to restore document' }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      archived: false,
      document,
    })
  } catch (error) {
    console.error('Document restore error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
