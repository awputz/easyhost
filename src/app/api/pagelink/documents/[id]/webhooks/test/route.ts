import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sanitizeWebhookUrl } from '@/lib/sanitize'
import crypto from 'crypto'

// POST - Test a webhook endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { endpointId, url, secret } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate webhook URL to prevent SSRF attacks
    const urlValidation = sanitizeWebhookUrl(url)
    if (!urlValidation.valid) {
      return NextResponse.json({
        success: false,
        message: urlValidation.error || 'Invalid URL',
      }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - simulate success
      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully (demo mode)',
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
      .select('id, user_id, title')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Send test webhook
    const testPayload = {
      event: 'test',
      documentId: id,
      documentTitle: document.title,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Pagelink',
        testId: crypto.randomUUID(),
      },
    }

    const signature = generateSignature(JSON.stringify(testPayload), secret || 'test_secret')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(urlValidation.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test',
          'X-Webhook-Timestamp': testPayload.timestamp,
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        // Log successful test
        if (endpointId) {
          await supabase.from('pagelink_webhook_logs').insert({
            document_id: id,
            endpoint_id: endpointId,
            event_type: 'test',
            success: true,
            status_code: response.status,
            created_at: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          success: true,
          message: `Test webhook sent successfully! Status: ${response.status}`,
          statusCode: response.status,
        })
      } else {
        // Log failed test
        if (endpointId) {
          await supabase.from('pagelink_webhook_logs').insert({
            document_id: id,
            endpoint_id: endpointId,
            event_type: 'test',
            success: false,
            status_code: response.status,
            created_at: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          success: false,
          message: `Webhook endpoint returned status ${response.status}`,
          statusCode: response.status,
        })
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      const isTimeout = errorMessage.includes('abort')

      // Log failed test
      if (endpointId) {
        await supabase.from('pagelink_webhook_logs').insert({
          document_id: id,
          endpoint_id: endpointId,
          event_type: 'test',
          success: false,
          status_code: 0,
          error_message: isTimeout ? 'Request timed out' : errorMessage,
          created_at: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: false,
        message: isTimeout ? 'Request timed out after 10 seconds' : `Failed to reach endpoint: ${errorMessage}`,
      })
    }
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSignature(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}
