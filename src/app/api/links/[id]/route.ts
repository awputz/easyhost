import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        link: {
          id,
          slug: 'demo123',
          asset_id: 'demo-asset',
          is_active: true,
          view_count: 10,
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: link, error } = await supabase
      .from('short_links')
      .select(`
        *,
        asset:assets(id, filename, mime_type, public_path, size_bytes),
        collection:collections(id, name, slug)
      `)
      .eq('id', id)
      .single()

    if (error || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('Get link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      custom_slug,
      password,
      remove_password,
      expires_at,
      max_views,
      allowed_emails,
      is_active,
    } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        link: {
          id,
          slug: custom_slug || 'demo123',
          is_active: is_active ?? true,
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

    // Build update object
    const updates: Record<string, unknown> = {}

    if (custom_slug !== undefined) {
      // Check slug availability
      const { data: existingLink } = await supabase
        .from('short_links')
        .select('id')
        .eq('slug', custom_slug)
        .neq('id', id)
        .single()

      if (existingLink) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        )
      }
      updates.slug = custom_slug
    }

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10)
    }

    if (remove_password) {
      updates.password_hash = null
    }

    if (expires_at !== undefined) {
      updates.expires_at = expires_at
    }

    if (max_views !== undefined) {
      updates.max_views = max_views
    }

    if (allowed_emails !== undefined) {
      updates.allowed_emails = allowed_emails
    }

    if (is_active !== undefined) {
      updates.is_active = is_active
    }

    const { data: link, error } = await supabase
      .from('short_links')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        asset:assets(id, filename, mime_type, public_path),
        collection:collections(id, name, slug)
      `)
      .single()

    if (error) {
      console.error('Failed to update link:', error)
      return NextResponse.json(
        { error: 'Failed to update link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error('Update link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { error } = await supabase
      .from('short_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete link:', error)
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
