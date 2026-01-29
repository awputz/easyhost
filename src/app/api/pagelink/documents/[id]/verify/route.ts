import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

// POST - Verify password for a protected document
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

    // Get document with password hash
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .select('id, password_hash, html, title, theme')
      .eq('id', id)
      .single()

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
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, document.password_hash)

    if (!isValid) {
      return NextResponse.json({ verified: false, error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({
      verified: true,
      html: document.html,
      title: document.title,
      theme: document.theme,
    })
  } catch (error) {
    console.error('Password verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
