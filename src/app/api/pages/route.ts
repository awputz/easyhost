import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Page, PageTheme, PageTemplateType } from '@/types'

// GET - List all pages for the user's workspace
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoPages())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoPages())
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get pages
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching pages:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    return NextResponse.json(pages || [])
  } catch (error) {
    console.error('Pages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      html,
      theme = 'professional-dark',
      templateType,
      isPublic = true,
    } = body as {
      title: string
      html: string
      theme?: PageTheme
      templateType?: PageTemplateType
      isPublic?: boolean
    }

    if (!title || !html) {
      return NextResponse.json(
        { error: 'Title and HTML are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - return mock page
      const mockPage = {
        id: `demo-${Date.now()}`,
        slug: generateSlug(),
        title,
        html,
        theme,
        template_type: templateType,
        is_public: isPublic,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(mockPage)
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Generate unique slug
    const slug = generateSlug()

    // Create page
    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspace.id,
        slug,
        title,
        html,
        theme,
        template_type: templateType || null,
        is_public: isPublic,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Pages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing page
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      title,
      html,
      theme,
      templateType,
      isPublic,
    } = body as {
      id: string
      title?: string
      html?: string
      theme?: PageTheme
      templateType?: PageTemplateType
      isPublic?: boolean
    }

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
    }

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

    // Build update object
    const updates: Partial<Page> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (html !== undefined) updates.html = html
    if (theme !== undefined) updates.theme = theme
    if (templateType !== undefined) updates.template_type = templateType
    if (isPublic !== undefined) updates.is_public = isPublic

    const { data: page, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating page:', error)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Pages PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}

function getDemoPages(): Page[] {
  return [
    {
      id: 'demo-1',
      workspace_id: 'demo-workspace',
      slug: 'pitch-deck-demo',
      title: 'Series A Pitch Deck',
      description: 'Our startup pitch deck for Series A investors',
      html: '<h1>Demo Pitch Deck</h1>',
      template_type: 'pitch-deck',
      theme: 'professional-dark',
      branding: {},
      is_public: true,
      password_hash: null,
      metadata: {},
      view_count: 142,
      created_by: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-2',
      workspace_id: 'demo-workspace',
      slug: 'proposal-demo',
      title: 'Q4 Marketing Proposal',
      description: 'Marketing strategy proposal for Q4 2024',
      html: '<h1>Marketing Proposal</h1>',
      template_type: 'proposal',
      theme: 'corporate-blue',
      branding: {},
      is_public: true,
      password_hash: null,
      metadata: {},
      view_count: 58,
      created_by: null,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-3',
      workspace_id: 'demo-workspace',
      slug: 'one-pager-demo',
      title: 'Product One-Pager',
      description: 'Quick overview of our product',
      html: '<h1>Product Overview</h1>',
      template_type: 'one-pager',
      theme: 'clean-light',
      branding: {},
      is_public: false,
      password_hash: null,
      metadata: {},
      view_count: 23,
      created_by: null,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
