import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        profile: getDemoProfile(),
        workspace: getDemoWorkspace(),
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        profile: getDemoProfile(),
        workspace: getDemoWorkspace(),
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (workspaceError) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ profile, workspace })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile: profileUpdate, workspace: workspaceUpdate } = body

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        profile: { ...getDemoProfile(), ...profileUpdate },
        workspace: { ...getDemoWorkspace(), ...workspaceUpdate },
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

    let profile = null
    let workspace = null

    // Update profile if provided
    if (profileUpdate) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileUpdate.full_name,
          avatar_url: profileUpdate.avatar_url,
          settings: profileUpdate.settings,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
      profile = data
    }

    // Update workspace if provided
    if (workspaceUpdate) {
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: workspaceUpdate.name,
          slug: workspaceUpdate.slug,
          custom_domain: workspaceUpdate.custom_domain,
          branding: workspaceUpdate.branding,
          settings: workspaceUpdate.settings,
        })
        .eq('owner_id', user.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
      }
      workspace = data
    }

    return NextResponse.json({ profile, workspace })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoProfile() {
  return {
    id: 'demo-user-id',
    username: 'demo',
    email: 'demo@example.com',
    full_name: 'Demo User',
    avatar_url: null,
    plan: 'pro',
    plan_expires_at: null,
    storage_used_bytes: 52428800, // 50 MB
    bandwidth_used_bytes: 104857600, // 100 MB
    bandwidth_reset_at: new Date().toISOString(),
    settings: {
      theme: 'system',
      notifications: true,
      defaultView: 'grid',
    },
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function getDemoWorkspace() {
  return {
    id: 'demo-workspace-id',
    name: "Demo User's Workspace",
    slug: 'demo',
    owner_id: 'demo-user-id',
    custom_domain: null,
    branding: {
      logo_url: null,
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
    },
    settings: {},
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
}
