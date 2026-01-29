import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const exportFormat = searchParams.get('format') || 'csv' // csv or json

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return generateDemoExport(days, exportFormat)
    }

    const supabase = await createClient()
    if (!supabase) {
      return generateDemoExport(days, exportFormat)
    }

    // Get authenticated user
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

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const workspaceId = workspace.id as string

    // Calculate date range
    const now = new Date()
    const rangeStart = startDate ? new Date(startDate) : subDays(now, days)
    const rangeEnd = endDate ? new Date(endDate) : now

    // Fetch all analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select(`
        *,
        asset:assets(filename),
        short_link:short_links(slug),
        collection:collections(name)
      `)
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfDay(rangeStart).toISOString())
      .lte('created_at', endOfDay(rangeEnd).toISOString())
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('Failed to fetch analytics for export:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    const processedEvents = (events || []).map(event => ({
      timestamp: event.created_at,
      event_type: event.event_type,
      asset: event.asset?.filename || '',
      link_slug: event.short_link?.slug || '',
      collection: event.collection?.name || '',
      country: event.country_name || '',
      city: event.city || '',
      referrer: event.referrer || '',
      utm_source: event.utm_source || '',
      utm_medium: event.utm_medium || '',
      utm_campaign: event.utm_campaign || '',
    }))

    if (exportFormat === 'json') {
      return NextResponse.json(processedEvents, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${format(rangeStart, 'yyyy-MM-dd')}-to-${format(rangeEnd, 'yyyy-MM-dd')}.json"`,
        },
      })
    }

    // Generate CSV
    const csv = generateCSV(processedEvents)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${format(rangeStart, 'yyyy-MM-dd')}-to-${format(rangeEnd, 'yyyy-MM-dd')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateDemoExport(days: number, exportFormat: string) {
  const now = new Date()
  const events = []

  // Generate sample events
  for (let i = 0; i < days; i++) {
    const date = subDays(now, i)
    const numEvents = Math.floor(Math.random() * 20) + 5

    for (let j = 0; j < numEvents; j++) {
      events.push({
        timestamp: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
        event_type: Math.random() > 0.8 ? 'download' : 'view',
        asset: ['product-hero.png', 'pricing-table.pdf', 'demo-video.mp4', 'logo-dark.svg'][Math.floor(Math.random() * 4)],
        link_slug: Math.random() > 0.5 ? ['abc123', 'xyz789', 'demo01'][Math.floor(Math.random() * 3)] : '',
        collection: Math.random() > 0.7 ? ['Q4 Marketing', 'Product Launch'][Math.floor(Math.random() * 2)] : '',
        country: ['United States', 'United Kingdom', 'Germany', 'Canada'][Math.floor(Math.random() * 4)],
        city: ['New York', 'London', 'Berlin', 'Toronto', 'San Francisco'][Math.floor(Math.random() * 5)],
        referrer: ['', 'google.com', 'twitter.com', 'linkedin.com'][Math.floor(Math.random() * 4)],
        utm_source: Math.random() > 0.7 ? ['newsletter', 'social', 'partner'][Math.floor(Math.random() * 3)] : '',
        utm_medium: Math.random() > 0.7 ? ['email', 'cpc', 'referral'][Math.floor(Math.random() * 3)] : '',
        utm_campaign: Math.random() > 0.8 ? ['launch-2024', 'summer-promo'][Math.floor(Math.random() * 2)] : '',
      })
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const rangeStart = subDays(now, days)
  const rangeEnd = now

  if (exportFormat === 'json') {
    return NextResponse.json(events, {
      headers: {
        'Content-Disposition': `attachment; filename="analytics-${format(rangeStart, 'yyyy-MM-dd')}-to-${format(rangeEnd, 'yyyy-MM-dd')}.json"`,
      },
    })
  }

  const csv = generateCSV(events)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${format(rangeStart, 'yyyy-MM-dd')}-to-${format(rangeEnd, 'yyyy-MM-dd')}.csv"`,
    },
  })
}

interface ExportEvent {
  timestamp: string
  event_type: string
  asset: string
  link_slug: string
  collection: string
  country: string
  city: string
  referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
}

function generateCSV(events: ExportEvent[]): string {
  const headers = [
    'Timestamp',
    'Event Type',
    'Asset',
    'Link Slug',
    'Collection',
    'Country',
    'City',
    'Referrer',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
  ]

  const rows = events.map(event => [
    event.timestamp,
    event.event_type,
    event.asset,
    event.link_slug,
    event.collection,
    event.country,
    event.city,
    event.referrer,
    event.utm_source,
    event.utm_medium,
    event.utm_campaign,
  ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))

  return [headers.join(','), ...rows].join('\n')
}
