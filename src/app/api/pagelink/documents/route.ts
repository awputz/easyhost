import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { authenticateRequest, apiError } from '@/lib/api-auth'
import { createDocumentSchema, validateBody, formatZodErrors } from '@/lib/validations'
import { rateLimiters, getRateLimitHeaders } from '@/lib/rate-limit'

// GET - List all documents for the current user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const showArchived = url.searchParams.get('archived') === 'true'
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'updated_at'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? true : false

    // Apply rate limiting
    const identifier = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = rateLimiters.api(identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    if (!isSupabaseConfigured()) {
      let docs = getDemoDocuments()
      if (search) {
        // Sanitize search input
        const sanitizedSearch = search.replace(/[<>]/g, '').substring(0, 100)
        docs = docs.filter(d => d.title.toLowerCase().includes(sanitizedSearch.toLowerCase()))
      }
      return NextResponse.json(docs)
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoDocuments())
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('UNAUTHORIZED', 'Authentication required')
    }

    let query = supabase
      .from('pagelink_documents')
      .select('id, slug, title, document_type, theme, is_public, view_count, created_at, updated_at, archived_at')
      .eq('user_id', user.id)

    // Filter by archived status
    if (showArchived) {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    // Sanitize and apply search filter
    if (search) {
      // Sanitize search input to prevent SQL injection via ilike
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').substring(0, 100)
      query = query.ilike('title', `%${sanitizedSearch}%`)
    }

    // Sorting - strict whitelist
    const validSortFields = ['updated_at', 'created_at', 'title', 'view_count']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at'
    query = query.order(sortField, { ascending: sortOrder })

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return apiError('INTERNAL_ERROR', 'Failed to fetch documents')
    }

    return NextResponse.json(documents || [])
  } catch (error) {
    console.error('Documents GET error:', error)
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    // Rate limit document creation
    const identifier = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = rateLimiters.documentCreate(identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('BAD_REQUEST', 'Invalid JSON body')
    }

    // Transform body keys to match schema
    const transformedBody = {
      title: (body as Record<string, unknown>).title,
      html: (body as Record<string, unknown>).html,
      slug: (body as Record<string, unknown>).slug,
      document_type: (body as Record<string, unknown>).documentType,
      theme: (body as Record<string, unknown>).theme,
      is_public: (body as Record<string, unknown>).isPublic,
    }

    const validation = validateBody(createDocumentSchema, transformedBody)
    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request data', {
        errors: formatZodErrors(validation.errors),
      })
    }

    const { title, html, slug: customSlug, document_type: documentType, theme, is_public: isPublic } = validation.data

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
      return apiError('INTERNAL_ERROR', 'Database connection failed')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('UNAUTHORIZED', 'Authentication required')
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    // Generate or validate slug
    let slug = customSlug || generateSlug()

    // Sanitize slug - only allow alphanumeric and hyphens
    slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').substring(0, 100)

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
      return apiError('INTERNAL_ERROR', 'Failed to create document')
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
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred')
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
      archived_at: null,
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
      archived_at: null,
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
      archived_at: null,
    },
  ]
}
