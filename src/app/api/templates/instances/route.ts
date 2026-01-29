import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// GET - List template instances
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('template_id')

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return sample instances
      return NextResponse.json({
        instances: [
          {
            id: 'inst-demo-1',
            template_id: 'demo-1',
            name: 'Acme Corp Landing Page',
            variables: {
              company_name: 'Acme Corp',
              hero_title: 'Build Better Products',
              primary_color: '#8b5cf6',
            },
            public_url: '/t/inst-demo-1',
            created_at: new Date().toISOString(),
          },
          {
            id: 'inst-demo-2',
            template_id: 'demo-1',
            name: 'TechStart Landing Page',
            variables: {
              company_name: 'TechStart',
              hero_title: 'Innovation Starts Here',
              primary_color: '#3b82f6',
            },
            public_url: '/t/inst-demo-2',
            created_at: new Date().toISOString(),
          },
        ],
        total: 2,
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ instances: [], total: 0 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ instances: [], total: 0 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ instances: [], total: 0 })
    }

    // Build query
    let query = supabase
      .from('template_instances')
      .select('*, template:assets(id, filename, public_path)', { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: instances, count, error } = await query

    if (error) {
      console.error('Failed to fetch template instances:', error)
      return NextResponse.json(
        { error: 'Failed to fetch instances' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      instances: instances || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Template instances API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new template instance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_id, name, variables } = body

    if (!template_id || !variables) {
      return NextResponse.json(
        { error: 'Template ID and variables are required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return a mock instance
      const instanceId = nanoid(10)
      return NextResponse.json({
        instance: {
          id: instanceId,
          template_id,
          name: name || 'Untitled Instance',
          variables,
          public_url: `/t/${instanceId}`,
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

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify template exists and belongs to workspace
    const { data: template } = await supabase
      .from('assets')
      .select('id')
      .eq('id', template_id)
      .eq('workspace_id', workspace.id)
      .eq('is_template', true)
      .single()

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Generate unique public URL
    const instanceId = nanoid(10)
    const publicUrl = `/t/${instanceId}`

    // Create instance
    const { data: instance, error } = await supabase
      .from('template_instances')
      .insert({
        template_id,
        workspace_id: workspace.id,
        name: name || 'Untitled Instance',
        variables,
        public_url: publicUrl,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create template instance:', error)
      return NextResponse.json(
        { error: 'Failed to create instance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ instance })
  } catch (error) {
    console.error('Create template instance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
