import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { apiError } from '@/lib/api-auth'
import { submitLeadSchema, validateBody, formatZodErrors, paginationSchema } from '@/lib/validations'
import { rateLimiters, getRateLimitHeaders } from '@/lib/rate-limit'
import crypto from 'crypto'

// Admin client for public lead submissions
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createAdminClient(supabaseUrl, supabaseServiceKey)
}

// GET /api/pagelink/documents/[id]/leads - Get leads for a document (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  if (!isSupabaseConfigured()) {
    // Demo mode - return mock leads
    return NextResponse.json({
      leads: [
        {
          id: 'demo-lead-1',
          email: 'john@example.com',
          name: 'John Doe',
          company: 'Acme Inc',
          phone: '+1 555-1234',
          customFields: {},
          createdAt: new Date().toISOString(),
          viewedAt: new Date().toISOString(),
        },
        {
          id: 'demo-lead-2',
          email: 'jane@startup.io',
          name: 'Jane Smith',
          company: 'Startup.io',
          phone: null,
          customFields: {},
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          viewedAt: null,
        },
      ],
      total: 2,
      page,
      limit,
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

  // Verify user owns the document
  const { data: doc } = await supabase
    .from('pagelink_documents')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Get leads
  const { data: leads, error, count } = await supabase
    .from('pagelink_leads')
    .select('*', { count: 'exact' })
    .eq('document_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  return NextResponse.json({
    leads: leads?.map(l => ({
      id: l.id,
      email: l.email,
      name: l.name,
      company: l.company,
      phone: l.phone,
      customFields: l.custom_fields,
      createdAt: l.created_at,
      viewedAt: l.viewed_at,
    })) || [],
    total: count || 0,
    page,
    limit,
  })
}

// POST /api/pagelink/documents/[id]/leads - Submit a lead (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Rate limit lead submissions to prevent abuse
    const identifier = `lead:${id}:${request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'}`
    const rateLimitResult = rateLimiters.auth(identifier) // 5 per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
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

    const validation = validateBody(submitLeadSchema, body)
    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid lead data', {
        errors: formatZodErrors(validation.errors),
      })
    }

    const { email, name, company, phone, customFields } = validation.data

    if (!isSupabaseConfigured()) {
      // Demo mode - return success
      return NextResponse.json({
        success: true,
        leadId: `demo-${Date.now()}`,
        message: 'Lead captured successfully (demo mode)',
      })
    }

    const supabase = getAdminClient()
    if (!supabase) {
      return apiError('INTERNAL_ERROR', 'Database not configured')
    }

    // Validate document ID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return apiError('BAD_REQUEST', 'Invalid document ID')
    }

    // Verify document exists and has lead capture enabled
    const { data: doc, error: docError } = await supabase
      .from('pagelink_documents')
      .select('id, lead_capture, user_id')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (docError || !doc) {
      return apiError('NOT_FOUND', 'Document not found')
    }

    const leadCapture = doc.lead_capture as { enabled: boolean } | null
    if (!leadCapture?.enabled) {
      return apiError('BAD_REQUEST', 'Lead capture not enabled')
    }

    // Check if email already submitted for this document
    const { data: existingLead } = await supabase
      .from('pagelink_leads')
      .select('id')
      .eq('document_id', id)
      .eq('email', email) // Already normalized by Zod
      .single()

    if (existingLead) {
      // Update existing lead's viewed_at
      await supabase
        .from('pagelink_leads')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existingLead.id)

      return NextResponse.json({
        success: true,
        leadId: existingLead.id,
        message: 'Welcome back!',
      })
    }

    // Sanitize custom fields - remove any potentially dangerous content
    const sanitizedCustomFields: Record<string, string> = {}
    if (customFields) {
      for (const [key, value] of Object.entries(customFields)) {
        // Only allow safe field names and values
        const safeKey = key.replace(/[<>'"]/g, '').substring(0, 50)
        const safeValue = String(value).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').substring(0, 500)
        sanitizedCustomFields[safeKey] = safeValue
      }
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from('pagelink_leads')
      .insert({
        id: crypto.randomUUID(),
        document_id: id,
        user_id: doc.user_id,
        email: email, // Already normalized by Zod
        name: name || null,
        company: company || null,
        phone: phone || null,
        custom_fields: sanitizedCustomFields,
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.substring(0, 45) || null,
        user_agent: request.headers.get('user-agent')?.substring(0, 500) || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating lead:', insertError)
      return apiError('INTERNAL_ERROR', 'Failed to submit')
    }

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: 'Thank you for your interest!',
    })
  } catch (error) {
    console.error('Lead submission error:', error)
    return apiError('INTERNAL_ERROR', 'Failed to submit lead')
  }
}

// DELETE /api/pagelink/documents/[id]/leads - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('leadId')

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns the document
  const { data: doc } = await supabase
    .from('pagelink_documents')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('pagelink_leads')
    .delete()
    .eq('id', leadId)
    .eq('document_id', id)

  if (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
