import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ members: getDemoMembers() })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ members: getDemoMembers() })
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

    // Get workspace members with profile info
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        *,
        profile:profiles(id, username, email, full_name, avatar_url)
      `)
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role = 'viewer' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - just return success
      return NextResponse.json({
        message: 'Invitation sent',
        member: {
          user_id: 'new-invite',
          role,
          invited_at: new Date().toISOString(),
          joined_at: null,
          profile: {
            email,
            full_name: null,
            avatar_url: null,
          },
        },
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
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

    // Check if user exists
    const { data: invitedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!invitedProfile) {
      // In a real app, send invitation email here
      return NextResponse.json({
        message: 'Invitation email would be sent to new user',
        pending: true,
      })
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', invitedProfile.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add member
    const { data: newMember, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: invitedProfile.id,
        role,
        joined_at: new Date().toISOString(),
      })
      .select(`
        *,
        profile:profiles(id, username, email, full_name, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({ member: newMember })
  } catch (error) {
    console.error('Team POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoMembers() {
  return [
    {
      workspace_id: 'demo-workspace-id',
      user_id: 'demo-user-id',
      role: 'admin',
      invited_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      joined_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      profile: {
        id: 'demo-user-id',
        username: 'demo',
        email: 'demo@example.com',
        full_name: 'Demo User',
        avatar_url: null,
      },
    },
    {
      workspace_id: 'demo-workspace-id',
      user_id: 'member-1',
      role: 'editor',
      invited_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      joined_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      profile: {
        id: 'member-1',
        username: 'johnd',
        email: 'john@example.com',
        full_name: 'John Doe',
        avatar_url: null,
      },
    },
    {
      workspace_id: 'demo-workspace-id',
      user_id: 'member-2',
      role: 'viewer',
      invited_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      joined_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      profile: {
        id: 'member-2',
        username: 'janes',
        email: 'jane@example.com',
        full_name: 'Jane Smith',
        avatar_url: null,
      },
    },
  ]
}
