import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get a single template instance
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return a mock instance
      if (id.startsWith('inst-demo')) {
        return NextResponse.json({
          instance: {
            id,
            template_id: 'demo-1',
            name: 'Demo Instance',
            variables: {
              company_name: 'Demo Company',
              hero_title: 'Welcome to Demo',
              primary_color: '#8b5cf6',
            },
            public_url: `/t/${id}`,
            created_at: new Date().toISOString(),
          },
        })
      }
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
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

    // Get instance with template info
    const { data: instance, error } = await supabase
      .from('template_instances')
      .select('*, template:assets(id, filename, public_path, template_schema, storage_path)')
      .eq('id', id)
      .single()

    if (error || !instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ instance })
  } catch (error) {
    console.error('Get template instance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a template instance
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, variables } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        instance: {
          id,
          name: name || 'Updated Instance',
          variables: variables || {},
          public_url: `/t/${id}`,
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

    // Build update object
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (variables !== undefined) updates.variables = variables

    // Update instance
    const { data: instance, error } = await supabase
      .from('template_instances')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update template instance:', error)
      return NextResponse.json(
        { error: 'Failed to update instance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ instance })
  } catch (error) {
    console.error('Update template instance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template instance
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

    // Delete instance
    const { error } = await supabase
      .from('template_instances')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.id)

    if (error) {
      console.error('Failed to delete template instance:', error)
      return NextResponse.json(
        { error: 'Failed to delete instance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template instance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
