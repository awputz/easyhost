import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { Page } from '@/types'

// GET - Get a single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      // Demo mode - return demo page
      return NextResponse.json(getDemoPage(id))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoPage(id))
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Page GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a page
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

    // Delete associated chat messages first
    await supabase
      .from('page_chats')
      .delete()
      .eq('page_id', id)

    // Delete associated versions
    await supabase
      .from('page_versions')
      .delete()
      .eq('page_id', id)

    // Delete the page
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting page:', error)
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Page DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoPage(id: string): Page {
  const demoPages: Record<string, Page> = {
    'demo-1': {
      id: 'demo-1',
      workspace_id: 'demo-workspace',
      slug: 'pitch-deck-demo',
      title: 'Series A Pitch Deck',
      description: 'Our startup pitch deck for Series A investors',
      html: `
<section style="text-align: center; padding: 4rem 0;">
  <h1><span class="highlight">TechStartup Inc.</span></h1>
  <p style="font-size: 1.25rem; opacity: 0.8;">Revolutionizing the way businesses operate</p>
</section>

<section>
  <h2>The Problem</h2>
  <div class="card">
    <p>Every day, businesses waste countless hours on manual processes that should be automated. Current solutions are expensive, complex, and don't integrate well.</p>
  </div>
</section>

<section>
  <h2>Our Solution</h2>
  <div class="card">
    <p>We've built an AI-powered platform that automates business workflows with zero configuration. Simply describe what you want to accomplish, and our system handles the rest.</p>
  </div>
</section>

<section>
  <h2>Market Opportunity</h2>
  <div class="grid">
    <div class="card" style="text-align: center;">
      <div class="metric">$120B</div>
      <p>Total Addressable Market</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$15B</div>
      <p>Serviceable Market</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$2B</div>
      <p>Initial Target Market</p>
    </div>
  </div>
</section>

<section>
  <h2>Traction</h2>
  <div class="grid">
    <div class="card" style="text-align: center;">
      <div class="metric">50K+</div>
      <p>Active Users</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">200%</div>
      <p>QoQ Growth</p>
    </div>
    <div class="card" style="text-align: center;">
      <div class="metric">$500K</div>
      <p>ARR</p>
    </div>
  </div>
</section>

<section style="text-align: center; padding: 3rem 0;">
  <h2>The Ask</h2>
  <div class="card">
    <p>We're raising <span class="highlight">$5M Series A</span> to scale our team and accelerate growth.</p>
    <a href="mailto:founders@techstartup.com" class="cta">Get in Touch</a>
  </div>
</section>`,
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
  }

  return demoPages[id] || demoPages['demo-1']
}
