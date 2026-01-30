import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sanitizeWebhookUrl } from '@/lib/sanitize'
import crypto from 'crypto'

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  secret: string
  enabled: boolean
  events: string[]
  createdAt: string
  lastTriggeredAt?: string | null
  failureCount: number
}

interface WebhookConfig {
  enabled: boolean
  endpoints: WebhookEndpoint[]
  globalSecret?: string | null
}

// GET - Get webhook configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoWebhookConfig())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document with webhook config
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id, webhook_config')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ config: document.webhook_config || null })
  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update webhook configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { config } = body as { config: WebhookConfig }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, config })
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

    // Update webhook config
    const { error } = await supabase
      .from('pagelink_documents')
      .update({ webhook_config: config })
      .eq('id', id)

    if (error) {
      console.error('Webhook update error:', error)
      return NextResponse.json({ error: 'Failed to update webhook config' }, { status: 500 })
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Webhook PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Trigger a webhook (internal use for testing or manual triggers)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { event, data } = body

    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, delivered: 0 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get document with webhook config
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, webhook_config')
      .eq('id', id)
      .single()

    if (!document || !document.webhook_config?.enabled) {
      return NextResponse.json({ success: true, delivered: 0 })
    }

    const config = document.webhook_config as WebhookConfig
    const endpoints = config.endpoints.filter(
      e => e.enabled && e.events.includes(event)
    )

    let delivered = 0
    const results = []

    for (const endpoint of endpoints) {
      try {
        // Validate webhook URL to prevent SSRF attacks
        const urlValidation = sanitizeWebhookUrl(endpoint.url)
        if (!urlValidation.valid) {
          results.push({ endpointId: endpoint.id, success: false, error: 'Invalid URL' })
          await logWebhookDelivery(supabase, id, endpoint.id, event, false, 0)
          continue
        }

        const payload = {
          event,
          documentId: id,
          timestamp: new Date().toISOString(),
          data: data || {},
        }

        const signature = generateSignature(JSON.stringify(payload), endpoint.secret)

        const response = await fetch(urlValidation.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-Timestamp': payload.timestamp,
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          delivered++
          results.push({ endpointId: endpoint.id, success: true })

          // Update last triggered time
          await updateEndpointStatus(supabase, id, endpoint.id, true)
        } else {
          results.push({ endpointId: endpoint.id, success: false, status: response.status })
          await updateEndpointStatus(supabase, id, endpoint.id, false)
        }

        // Log the delivery
        await logWebhookDelivery(supabase, id, endpoint.id, event, response.ok, response.status)
      } catch (error) {
        results.push({ endpointId: endpoint.id, success: false, error: 'Network error' })
        await updateEndpointStatus(supabase, id, endpoint.id, false)
        await logWebhookDelivery(supabase, id, endpoint.id, event, false, 0)
      }
    }

    return NextResponse.json({ success: true, delivered, results })
  } catch (error) {
    console.error('Webhook POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSignature(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function updateEndpointStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  endpointId: string,
  success: boolean
) {
  if (!supabase) return

  const { data: document } = await supabase
    .from('pagelink_documents')
    .select('webhook_config')
    .eq('id', documentId)
    .single()

  if (!document?.webhook_config) return

  const config = document.webhook_config as WebhookConfig
  const updatedEndpoints = config.endpoints.map(e => {
    if (e.id === endpointId) {
      return {
        ...e,
        lastTriggeredAt: new Date().toISOString(),
        failureCount: success ? 0 : e.failureCount + 1,
      }
    }
    return e
  })

  await supabase
    .from('pagelink_documents')
    .update({
      webhook_config: {
        ...config,
        endpoints: updatedEndpoints,
      },
    })
    .eq('id', documentId)
}

async function logWebhookDelivery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  endpointId: string,
  event: string,
  success: boolean,
  statusCode: number
) {
  if (!supabase) return

  await supabase.from('pagelink_webhook_logs').insert({
    document_id: documentId,
    endpoint_id: endpointId,
    event_type: event,
    success,
    status_code: statusCode,
    created_at: new Date().toISOString(),
  })
}

function getDemoWebhookConfig() {
  return {
    config: {
      enabled: true,
      endpoints: [
        {
          id: 'demo-1',
          name: 'Zapier Integration',
          url: 'https://hooks.zapier.com/demo',
          secret: 'whsec_demo_secret_key_12345',
          enabled: true,
          events: ['document.viewed', 'lead.captured'],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          failureCount: 0,
        },
      ],
      globalSecret: null,
    },
  }
}
