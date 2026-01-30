import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - Get webhook logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const endpointId = searchParams.get('endpointId')
  const successOnly = searchParams.get('success') === 'true'
  const failedOnly = searchParams.get('failed') === 'true'

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoWebhookLogs())
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

    // Build query
    let query = supabase
      .from('pagelink_webhook_logs')
      .select('*', { count: 'exact' })
      .eq('document_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (endpointId) {
      query = query.eq('endpoint_id', endpointId)
    }

    if (successOnly) {
      query = query.eq('success', true)
    } else if (failedOnly) {
      query = query.eq('success', false)
    }

    const { data: logs, count, error } = await query

    if (error) {
      console.error('Webhook logs query error:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Get stats
    const { data: stats } = await supabase
      .from('pagelink_webhook_logs')
      .select('success')
      .eq('document_id', id)

    const totalDeliveries = stats?.length || 0
    const successfulDeliveries = stats?.filter(s => s.success).length || 0
    const failedDeliveries = totalDeliveries - successfulDeliveries

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      stats: {
        total: totalDeliveries,
        successful: successfulDeliveries,
        failed: failedDeliveries,
        successRate: totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) : 0,
      },
    })
  } catch (error) {
    console.error('Webhook logs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Clear webhook logs
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

    // Verify document ownership
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete all logs for this document
    const { error } = await supabase
      .from('pagelink_webhook_logs')
      .delete()
      .eq('document_id', id)

    if (error) {
      console.error('Webhook logs delete error:', error)
      return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook logs DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoWebhookLogs() {
  const now = Date.now()
  return {
    logs: [
      {
        id: 'log-1',
        document_id: 'demo',
        endpoint_id: 'demo-1',
        event_type: 'document.viewed',
        success: true,
        status_code: 200,
        created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-2',
        document_id: 'demo',
        endpoint_id: 'demo-1',
        event_type: 'lead.captured',
        success: true,
        status_code: 200,
        created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-3',
        document_id: 'demo',
        endpoint_id: 'demo-1',
        event_type: 'document.viewed',
        success: false,
        status_code: 500,
        error_message: 'Internal server error',
        created_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-4',
        document_id: 'demo',
        endpoint_id: 'demo-1',
        event_type: 'feedback.submitted',
        success: true,
        status_code: 200,
        created_at: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
    total: 4,
    stats: {
      total: 4,
      successful: 3,
      failed: 1,
      successRate: '75.0',
    },
  }
}
