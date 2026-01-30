import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import crypto from 'crypto'

// Generate a verification token
function generateVerificationToken(): string {
  return `pagelink-verify=${crypto.randomBytes(16).toString('hex')}`
}

// GET /api/domains - List domains for a workspace/document
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  const documentId = searchParams.get('documentId')

  if (!isSupabaseConfigured()) {
    // Demo mode - return mock domains
    return NextResponse.json({
      domains: [
        {
          id: 'demo-domain-1',
          domain: 'docs.example.com',
          status: 'verified',
          verificationToken: 'pagelink-verify=demo123',
          verifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
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

  let query = supabase
    .from('custom_domains')
    .select('*')

  if (documentId) {
    query = query.eq('document_id', documentId)
  } else if (workspaceId) {
    query = query.eq('workspace_id', workspaceId).is('document_id', null)
  }

  const { data: domains, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }

  return NextResponse.json({
    domains: domains?.map(d => ({
      id: d.id,
      domain: d.domain,
      status: d.status,
      verificationToken: d.verification_token,
      verifiedAt: d.verified_at,
      createdAt: d.created_at,
    })) || [],
  })
}

// POST /api/domains - Add a new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, workspaceId, documentId } = body

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - return mock domain
      const mockDomain = {
        id: `demo-${Date.now()}`,
        domain: domain.toLowerCase(),
        status: 'pending',
        verificationToken: generateVerificationToken(),
        verifiedAt: null,
        createdAt: new Date().toISOString(),
      }
      return NextResponse.json({ domain: mockDomain }, { status: 201 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('custom_domains')
      .select('id')
      .eq('domain', domain.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Domain is already registered' }, { status: 400 })
    }

    // Create the domain record
    const verificationToken = generateVerificationToken()
    const { data: newDomain, error: insertError } = await supabase
      .from('custom_domains')
      .insert({
        id: crypto.randomUUID(),
        domain: domain.toLowerCase(),
        workspace_id: workspaceId,
        document_id: documentId || null,
        user_id: user.id,
        status: 'pending',
        verification_token: verificationToken,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating domain:', insertError)
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
    }

    return NextResponse.json({
      domain: {
        id: newDomain.id,
        domain: newDomain.domain,
        status: newDomain.status,
        verificationToken: newDomain.verification_token,
        verifiedAt: newDomain.verified_at,
        createdAt: newDomain.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding domain:', error)
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
  }
}
