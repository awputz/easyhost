import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

// POST - Verify password for a protected document
// Supports both ID and slug as the [id] parameter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - accept any password
      return NextResponse.json({ verified: true })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get document with password hash - try ID first, then slug
    let document = null
    let error = null

    // Check if id looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (isUuid) {
      const result = await supabase
        .from('pagelink_documents')
        .select('id, password_hash, html, title, theme, show_pagelink_badge')
        .eq('id', id)
        .single()
      document = result.data
      error = result.error
    }

    // If not found by ID or not a UUID, try by slug
    if (!document) {
      const result = await supabase
        .from('pagelink_documents')
        .select('id, password_hash, html, title, theme, show_pagelink_badge')
        .eq('slug', id)
        .single()
      document = result.data
      error = result.error
    }

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.password_hash) {
      // Document has no password
      return NextResponse.json({
        verified: true,
        html: document.html,
        title: document.title,
        theme: document.theme,
        showBadge: document.show_pagelink_badge,
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, document.password_hash)

    if (!isValid) {
      return NextResponse.json({ verified: false, error: 'Invalid password' }, { status: 401 })
    }

    // Increment view count on successful verification
    await supabase.rpc('increment_pagelink_view_count', { doc_slug: id })

    return NextResponse.json({
      verified: true,
      html: document.html,
      title: document.title,
      theme: document.theme,
      showBadge: document.show_pagelink_badge,
    })
  } catch (error) {
    console.error('Password verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
