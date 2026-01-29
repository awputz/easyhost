import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - List all documents for the current user
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoDocuments())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoDocuments())
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: documents, error } = await supabase
      .from('pagelink_documents')
      .select('id, slug, title, document_type, theme, is_public, view_count, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json(documents || [])
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      html,
      documentType,
      theme = 'midnight',
      isPublic = true,
      slug: customSlug,
    } = body

    if (!title || !html) {
      return NextResponse.json(
        { error: 'Title and HTML are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      // Demo mode
      const demoDoc = {
        id: `demo-${Date.now()}`,
        slug: customSlug || generateSlug(),
        title,
        html,
        document_type: documentType,
        theme,
        is_public: isPublic,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(demoDoc)
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

    // Generate or validate slug
    let slug = customSlug || generateSlug()

    // Check if slug is unique
    const { data: existing } = await supabase
      .from('pagelink_documents')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Create document
    const { data: document, error } = await supabase
      .from('pagelink_documents')
      .insert({
        workspace_id: workspace?.id,
        user_id: user.id,
        slug,
        title,
        html,
        document_type: documentType,
        theme,
        is_public: isPublic,
        show_pagelink_badge: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // Create initial version
    await supabase.from('pagelink_document_versions').insert({
      document_id: document.id,
      html,
      title,
      version_number: 1,
      created_by: user.id,
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSlug(): string {
  const adjectives = ['bold', 'swift', 'bright', 'clear', 'prime', 'keen', 'smart', 'quick', 'sharp', 'fresh']
  const nouns = ['oak', 'hawk', 'peak', 'wave', 'star', 'deck', 'page', 'leaf', 'beam', 'spark']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 999)
  return `${adj}-${noun}-${num}`
}

function getDemoDocuments() {
  return [
    {
      id: 'demo-1',
      slug: 'bold-hawk-123',
      title: 'Series A Pitch Deck',
      document_type: 'pitch_deck',
      theme: 'charcoal',
      is_public: true,
      view_count: 47,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-2',
      slug: 'swift-peak-456',
      title: '146 West 28th St - Investment Memo',
      document_type: 'investment_memo',
      theme: 'midnight',
      is_public: true,
      view_count: 23,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-3',
      slug: 'bright-wave-789',
      title: 'Q1 Consulting Proposal',
      document_type: 'proposal',
      theme: 'slate',
      is_public: false,
      view_count: 12,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
