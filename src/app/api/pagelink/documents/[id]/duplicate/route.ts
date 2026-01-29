import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// POST - Duplicate a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        id: `demo-${Date.now()}`,
        slug: `copy-${Date.now().toString(36)}`,
        title: 'Copy of Demo Document',
        message: 'Document duplicated (demo mode)',
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the original document
    const { data: original, error: fetchError } = await supabase
      .from('pagelink_documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate a new unique slug
    const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`

    // Create the duplicate
    const { data: duplicate, error: createError } = await supabase
      .from('pagelink_documents')
      .insert({
        workspace_id: original.workspace_id,
        user_id: user.id,
        slug: newSlug,
        title: `Copy of ${original.title}`,
        html: original.html,
        document_type: original.document_type,
        theme: original.theme,
        is_public: false, // Start as private
        show_pagelink_badge: original.show_pagelink_badge,
        custom_branding: original.custom_branding,
        // Don't copy: password_hash, expires_at, allowed_emails, view_count, archived_at
      })
      .select()
      .single()

    if (createError) {
      console.error('Error duplicating document:', createError)
      return NextResponse.json({ error: 'Failed to duplicate document' }, { status: 500 })
    }

    // Create initial version for duplicate
    await supabase.from('pagelink_document_versions').insert({
      document_id: duplicate.id,
      html: original.html,
      title: `Copy of ${original.title}`,
      version_number: 1,
      created_by: user.id,
    })

    return NextResponse.json({
      id: duplicate.id,
      slug: duplicate.slug,
      title: duplicate.title,
      message: 'Document duplicated successfully',
    })
  } catch (error) {
    console.error('Document duplicate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
