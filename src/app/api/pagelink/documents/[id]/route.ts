import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

// GET - Get a single document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoDocument(id))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoDocument(id))
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Try to get document - allow if user owns it or it's public
    let query = supabase
      .from('pagelink_documents')
      .select('*')
      .eq('id', id)

    if (user) {
      // User is logged in - they can see their own docs
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      // Not logged in - only public docs
      query = query.eq('is_public', true)
    }

    const { data: document, error } = await query.single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Don't return password hash
    const { password_hash, ...safeDoc } = document
    return NextResponse.json({
      ...safeDoc,
      has_password: !!password_hash,
    })
  } catch (error) {
    console.error('Document GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const {
      title,
      html,
      slug,
      theme,
      isPublic,
      password,
      removePassword,
      expiresAt,
      allowedEmails,
      showPagelinkBadge,
      customBranding,
      seo,
      leadCapture,
      feedbackConfig,
      abTestConfig,
      webhookConfig,
    } = body

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, id })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('pagelink_documents')
      .select('id, user_id, html, title, slug')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if (title !== undefined) updates.title = title
    if (html !== undefined) updates.html = html
    if (theme !== undefined) updates.theme = theme
    if (isPublic !== undefined) updates.is_public = isPublic
    if (expiresAt !== undefined) updates.expires_at = expiresAt
    if (allowedEmails !== undefined) updates.allowed_emails = allowedEmails
    if (showPagelinkBadge !== undefined) updates.show_pagelink_badge = showPagelinkBadge
    if (customBranding !== undefined) updates.custom_branding = customBranding
    if (seo !== undefined) updates.seo = seo
    if (leadCapture !== undefined) updates.lead_capture = leadCapture
    if (feedbackConfig !== undefined) updates.feedback_config = feedbackConfig
    if (abTestConfig !== undefined) updates.ab_test_config = abTestConfig
    if (webhookConfig !== undefined) updates.webhook_config = webhookConfig

    // Handle password
    if (removePassword) {
      updates.password_hash = null
    } else if (password) {
      updates.password_hash = await bcrypt.hash(password, 10)
    }

    // Handle slug change
    if (slug && slug !== existing.slug) {
      // Check if new slug is available
      const { data: slugExists } = await supabase
        .from('pagelink_documents')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (slugExists) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
      }
      updates.slug = slug
    }

    // Update document
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // Create new version if HTML changed
    if (html && html !== existing.html) {
      // Get current version number
      const { data: versions } = await supabase
        .from('pagelink_document_versions')
        .select('version_number')
        .eq('document_id', id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersion = (versions?.[0]?.version_number || 0) + 1

      await supabase.from('pagelink_document_versions').insert({
        document_id: id,
        html,
        title: title || existing.title,
        version_number: nextVersion,
        created_by: user.id,
      })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Document PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
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

    // Delete document (cascades to versions and analytics)
    const { error } = await supabase
      .from('pagelink_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoDocument(id: string) {
  return {
    id,
    slug: 'demo-document',
    title: 'Demo Document',
    html: '<h1>Demo</h1><p>This is a demo document.</p>',
    document_type: 'custom',
    theme: 'midnight',
    is_public: true,
    has_password: false,
    show_pagelink_badge: true,
    view_count: 42,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
