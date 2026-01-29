import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Demo mode - return sample templates
      return NextResponse.json({
        templates: [
          {
            id: 'demo-1',
            filename: 'landing-page.html',
            public_path: '/demo/templates/landing-page.html',
            mime_type: 'text/html',
            size_bytes: 12500,
            is_template: true,
            template_schema: [
              { name: 'company_name', type: 'text', required: true, description: 'Company name' },
              { name: 'hero_title', type: 'text', required: true, description: 'Main headline' },
              { name: 'primary_color', type: 'color', required: false, default: '#8b5cf6' },
              { name: 'logo_url', type: 'image', required: false },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            filename: 'email-template.html',
            public_path: '/demo/templates/email-template.html',
            mime_type: 'text/html',
            size_bytes: 5200,
            is_template: true,
            template_schema: [
              { name: 'recipient_name', type: 'text', required: true },
              { name: 'message', type: 'text', required: true },
              { name: 'sender_name', type: 'text', required: true },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 2,
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ templates: [], total: 0 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ templates: [], total: 0 })
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ templates: [], total: 0 })
    }

    // Fetch templates (assets marked as templates)
    const { data: templates, count, error } = await supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspace.id)
      .eq('is_template', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
