import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { headers } from 'next/headers'

interface ABVariant {
  id: string
  name: string
  html: string
  trafficPercent: number
  views: number
  conversions: number
  conversionRate: number
}

// GET - Get A/B test results (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoABTestData())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document with A/B test config
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id, ab_test_config')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get A/B test events for this document
    const { data: events } = await supabase
      .from('pagelink_ab_test_events')
      .select('variant_id, event_type, created_at')
      .eq('document_id', id)
      .order('created_at', { ascending: false })

    const config = document.ab_test_config || null

    // Calculate stats for each variant
    if (config?.variants) {
      const variantStats: Record<string, { views: number; conversions: number }> = {}

      for (const variant of config.variants) {
        variantStats[variant.id] = { views: 0, conversions: 0 }
      }

      if (events) {
        for (const event of events) {
          if (variantStats[event.variant_id]) {
            if (event.event_type === 'view') {
              variantStats[event.variant_id].views++
            } else if (event.event_type === 'conversion') {
              variantStats[event.variant_id].conversions++
            }
          }
        }
      }

      // Update variant stats
      config.variants = config.variants.map((v: ABVariant) => ({
        ...v,
        views: variantStats[v.id]?.views || 0,
        conversions: variantStats[v.id]?.conversions || 0,
        conversionRate: variantStats[v.id]?.views > 0
          ? (variantStats[v.id].conversions / variantStats[v.id].views) * 100
          : 0,
      }))
    }

    return NextResponse.json({ config, events: events || [] })
  } catch (error) {
    console.error('AB Test GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record A/B test event (public - for tracking)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { variantId, eventType } = body

    if (!variantId || !eventType) {
      return NextResponse.json({ error: 'Variant ID and event type required' }, { status: 400 })
    }

    if (!['view', 'conversion'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get request metadata
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown'
    const userAgent = headersList.get('user-agent') || null

    // Record the event
    const { error } = await supabase
      .from('pagelink_ab_test_events')
      .insert({
        document_id: id,
        variant_id: variantId,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (error) {
      console.error('AB test event insert error:', error)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AB Test POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Declare a winner (authenticated)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { winnerId } = body

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

    // Get document
    const { data: document } = await supabase
      .from('pagelink_documents')
      .select('id, user_id, ab_test_config, html')
      .eq('id', id)
      .single()

    if (!document || document.user_id !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const config = document.ab_test_config

    if (!config || !config.variants) {
      return NextResponse.json({ error: 'No A/B test configured' }, { status: 400 })
    }

    // Find winning variant
    const winningVariant = config.variants.find((v: ABVariant) => v.id === winnerId)
    if (!winningVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 400 })
    }

    // Update config with winner and end date
    const updatedConfig = {
      ...config,
      winnerId,
      endedAt: new Date().toISOString(),
      enabled: false, // Disable the test
    }

    // Update document with winning variant's HTML and updated config
    const { error } = await supabase
      .from('pagelink_documents')
      .update({
        html: winningVariant.html,
        ab_test_config: updatedConfig,
      })
      .eq('id', id)

    if (error) {
      console.error('Winner declaration error:', error)
      return NextResponse.json({ error: 'Failed to declare winner' }, { status: 500 })
    }

    return NextResponse.json({ success: true, winner: winningVariant })
  } catch (error) {
    console.error('AB Test PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDemoABTestData() {
  return {
    config: {
      enabled: true,
      testName: 'Hero CTA Test',
      variants: [
        {
          id: 'variant-a',
          name: 'Original',
          html: '<h1>Original</h1>',
          trafficPercent: 50,
          views: 523,
          conversions: 42,
          conversionRate: 8.03,
        },
        {
          id: 'variant-b',
          name: 'Blue CTA',
          html: '<h1>Blue CTA</h1>',
          trafficPercent: 50,
          views: 518,
          conversions: 58,
          conversionRate: 11.2,
        },
      ],
      goalType: 'clicks',
      goalSelector: '.cta-button',
      minSampleSize: 100,
      confidenceLevel: 95,
      winnerId: null,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endedAt: null,
    },
    events: [],
  }
}
