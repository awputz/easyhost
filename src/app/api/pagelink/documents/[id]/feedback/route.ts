import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// GET - List feedback for a document (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        feedback: getDemoFeedback(),
        pagination: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify document ownership
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected'

    // Build query
    let query = supabase
      .from('pagelink_feedback')
      .select('*', { count: 'exact' })
      .eq('document_id', id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: feedback, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) {
      console.error('Feedback fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({
      feedback: feedback || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit feedback (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { type, content, reaction, rating, email, name } = body

    if (!type) {
      return NextResponse.json({ error: 'Feedback type is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, id: 'demo-feedback' })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check if document exists and get feedback settings
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, feedback_config')
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const config = document.feedback_config || {}

    // Validate email if required
    if (config.requireEmail && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get request metadata
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown'
    const userAgent = headersList.get('user-agent') || null

    // Determine initial status based on moderation setting
    const status = config.moderationEnabled ? 'pending' : 'approved'

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from('pagelink_feedback')
      .insert({
        document_id: id,
        type,
        content: content || null,
        reaction: reaction || null,
        rating: rating || null,
        email: email || null,
        name: name || null,
        status,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Feedback insert error:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // Track analytics
    await supabase.from('pagelink_analytics').insert({
      document_id: id,
      event_type: 'feedback_submitted',
      metadata: { feedback_type: type },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, id: feedback.id })
  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update feedback status (authenticated)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params

  try {
    const body = await request.json()
    const { feedbackId, status } = body

    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Feedback ID and status are required' }, { status: 400 })
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

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

    // Verify document ownership
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update feedback status
    const { error } = await supabase
      .from('pagelink_feedback')
      .update({ status, moderated_at: new Date().toISOString() })
      .eq('id', feedbackId)
      .eq('document_id', documentId)

    if (error) {
      console.error('Feedback update error:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete feedback (authenticated)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params
  const { searchParams } = new URL(request.url)
  const feedbackId = searchParams.get('feedbackId')

  if (!feedbackId) {
    return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 })
  }

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

    // Verify document ownership
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete feedback
    const { error } = await supabase
      .from('pagelink_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('document_id', documentId)

    if (error) {
      console.error('Feedback delete error:', error)
      return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoFeedback() {
  return [
    {
      id: 'demo-1',
      type: 'comment',
      content: 'This document is really well structured!',
      rating: 5,
      reaction: '👍',
      email: 'user@example.com',
      name: 'John Doe',
      status: 'approved',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-2',
      type: 'rating',
      rating: 4,
      reaction: '❤️',
      status: 'approved',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo-3',
      type: 'comment',
      content: 'Great content, very helpful for our team.',
      email: 'team@company.com',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}
