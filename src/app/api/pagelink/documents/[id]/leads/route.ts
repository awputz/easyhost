import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
    const body = await request.json()
    const { email, name, company, phone, customFields } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify document exists and has lead capture enabled
    const { data: doc, error: docError } = await supabase
      .from('pagelink_documents')
      .select('id, lead_capture, user_id')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const leadCapture = doc.lead_capture as { enabled: boolean } | null
    if (!leadCapture?.enabled) {
      return NextResponse.json({ error: 'Lead capture not enabled' }, { status: 400 })
    }

    // Check if email already submitted for this document
    const { data: existingLead } = await supabase
      .from('pagelink_leads')
      .select('id')
      .eq('document_id', id)
      .eq('email', email.toLowerCase())
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

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from('pagelink_leads')
      .insert({
        id: crypto.randomUUID(),
        document_id: id,
        user_id: doc.user_id,
        email: email.toLowerCase(),
        name: name || null,
        company: company || null,
        phone: phone || null,
        custom_fields: customFields || {},
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        user_agent: request.headers.get('user-agent') || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating lead:', insertError)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: 'Thank you for your interest!',
    })
  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
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
