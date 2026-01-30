import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET - Get analytics for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getDemoAnalytics())
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(getDemoAnalytics())
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get URL params for date range
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get document info (verify ownership)
    const { data: document, error: docError } = await supabase
      .from('pagelink_documents')
      .select('id, slug, title, view_count, user_id')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get analytics events
    const { data: events } = await supabase
      .from('pagelink_analytics')
      .select('*')
      .eq('document_id', document.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    // Process events into daily stats
    const dailyStats = processEventsIntoDailyStats(events || [], startDate, endDate)

    // Get referrer breakdown
    const referrerStats = processReferrerStats(events || [])

    // Get geographic stats (if available)
    const geoStats = processGeoStats(events || [])

    // Get device stats
    const deviceStats = processDeviceStats(events || [])

    // Get browser stats
    const browserStats = processBrowserStats(events || [])

    // Get hourly distribution
    const hourlyStats = processHourlyStats(events || [])

    // Get engagement metrics
    const engagementStats = processEngagementStats(events || [])

    // Get funnel metrics
    const funnelStats = processFunnelStats(events || [])

    // Calculate totals
    const totalViews = events?.filter(e => e.event_type === 'view').length || 0
    const uniqueVisitors = new Set(events?.map(e => e.visitor_id).filter(Boolean)).size

    // Calculate trends (compare to previous period)
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    const { data: previousEvents } = await supabase
      .from('pagelink_analytics')
      .select('event_type, visitor_id')
      .eq('document_id', document.id)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousViews = previousEvents?.filter(e => e.event_type === 'view').length || 0
    const previousVisitors = new Set(previousEvents?.map(e => e.visitor_id).filter(Boolean)).size

    const viewsTrend = previousViews > 0 ? ((totalViews - previousViews) / previousViews * 100).toFixed(1) : null
    const visitorsTrend = previousVisitors > 0 ? ((uniqueVisitors - previousVisitors) / previousVisitors * 100).toFixed(1) : null

    return NextResponse.json({
      document: {
        id: document.id,
        slug: document.slug,
        title: document.title,
        totalViews: document.view_count,
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      summary: {
        views: totalViews,
        uniqueVisitors,
        avgViewsPerDay: Math.round((totalViews / days) * 10) / 10,
        viewsTrend: viewsTrend ? parseFloat(viewsTrend) : null,
        visitorsTrend: visitorsTrend ? parseFloat(visitorsTrend) : null,
        bounceRate: engagementStats.bounceRate,
        avgTimeOnPage: engagementStats.avgTimeOnPage,
        avgScrollDepth: engagementStats.avgScrollDepth,
      },
      dailyStats,
      hourlyStats,
      referrerStats,
      geoStats,
      deviceStats,
      browserStats,
      engagementStats,
      funnelStats,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface AnalyticsEvent {
  id: string
  document_id: string
  event_type: string
  visitor_id?: string
  referrer?: string
  country?: string
  city?: string
  device_type?: string
  browser?: string
  os?: string
  time_on_page?: number
  scroll_depth?: number
  created_at: string
}

function processEventsIntoDailyStats(
  events: AnalyticsEvent[],
  startDate: Date,
  endDate: Date
) {
  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>()

  // Initialize all days in range
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0]
    dailyMap.set(dateKey, { views: 0, visitors: new Set() })
    current.setDate(current.getDate() + 1)
  }

  // Process events
  for (const event of events) {
    if (event.event_type === 'view') {
      const dateKey = event.created_at.split('T')[0]
      const day = dailyMap.get(dateKey)
      if (day) {
        day.views++
        if (event.visitor_id) {
          day.visitors.add(event.visitor_id)
        }
      }
    }
  }

  // Convert to array
  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    views: data.views,
    uniqueVisitors: data.visitors.size,
  }))
}

function processReferrerStats(events: AnalyticsEvent[]) {
  const referrerMap = new Map<string, number>()

  for (const event of events) {
    if (event.event_type === 'view' && event.referrer) {
      try {
        const url = new URL(event.referrer)
        const domain = url.hostname
        referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1)
      } catch {
        referrerMap.set('direct', (referrerMap.get('direct') || 0) + 1)
      }
    } else if (event.event_type === 'view') {
      referrerMap.set('direct', (referrerMap.get('direct') || 0) + 1)
    }
  }

  return Array.from(referrerMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function processGeoStats(events: AnalyticsEvent[]) {
  const countryMap = new Map<string, number>()

  for (const event of events) {
    if (event.event_type === 'view' && event.country) {
      countryMap.set(event.country, (countryMap.get(event.country) || 0) + 1)
    }
  }

  return Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function processDeviceStats(events: AnalyticsEvent[]) {
  const deviceMap = new Map<string, number>()

  for (const event of events) {
    if (event.event_type === 'view') {
      const device = event.device_type || 'Unknown'
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1)
    }
  }

  const total = Array.from(deviceMap.values()).reduce((a, b) => a + b, 0)

  return Array.from(deviceMap.entries())
    .map(([device, count]) => ({
      device,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function processBrowserStats(events: AnalyticsEvent[]) {
  const browserMap = new Map<string, number>()

  for (const event of events) {
    if (event.event_type === 'view') {
      const browser = event.browser || 'Unknown'
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1)
    }
  }

  const total = Array.from(browserMap.values()).reduce((a, b) => a + b, 0)

  return Array.from(browserMap.entries())
    .map(([browser, count]) => ({
      browser,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function processHourlyStats(events: AnalyticsEvent[]) {
  const hourlyMap = new Map<number, number>()

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0)
  }

  for (const event of events) {
    if (event.event_type === 'view') {
      const hour = new Date(event.created_at).getHours()
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
    }
  }

  return Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour)
}

function processEngagementStats(events: AnalyticsEvent[]) {
  const viewEvents = events.filter(e => e.event_type === 'view')
  const engagedEvents = events.filter(e => e.event_type === 'engaged')

  // Calculate bounce rate (views without engagement)
  const visitorEngagement = new Map<string, boolean>()
  for (const event of events) {
    if (event.visitor_id) {
      if (event.event_type === 'view' && !visitorEngagement.has(event.visitor_id)) {
        visitorEngagement.set(event.visitor_id, false)
      }
      if (event.event_type === 'engaged' || event.event_type === 'click' || event.event_type === 'scroll') {
        visitorEngagement.set(event.visitor_id, true)
      }
    }
  }

  const totalVisitors = visitorEngagement.size
  const engagedVisitors = Array.from(visitorEngagement.values()).filter(Boolean).length
  const bounceRate = totalVisitors > 0 ? Math.round((1 - engagedVisitors / totalVisitors) * 100) : 0

  // Calculate average time on page
  const timesOnPage = events
    .filter(e => e.time_on_page && e.time_on_page > 0)
    .map(e => e.time_on_page!)
  const avgTimeOnPage = timesOnPage.length > 0
    ? Math.round(timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length)
    : 0

  // Calculate average scroll depth
  const scrollDepths = events
    .filter(e => e.scroll_depth && e.scroll_depth > 0)
    .map(e => e.scroll_depth!)
  const avgScrollDepth = scrollDepths.length > 0
    ? Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length)
    : 0

  return {
    bounceRate,
    avgTimeOnPage,
    avgScrollDepth,
    totalViews: viewEvents.length,
    engagedViews: engagedEvents.length,
    engagementRate: viewEvents.length > 0
      ? Math.round((engagedEvents.length / viewEvents.length) * 100)
      : 0,
  }
}

function processFunnelStats(events: AnalyticsEvent[]) {
  const visitorJourney = new Map<string, Set<string>>()

  for (const event of events) {
    if (event.visitor_id) {
      if (!visitorJourney.has(event.visitor_id)) {
        visitorJourney.set(event.visitor_id, new Set())
      }
      visitorJourney.get(event.visitor_id)!.add(event.event_type)
    }
  }

  const totalVisitors = visitorJourney.size
  const viewed = Array.from(visitorJourney.values()).filter(s => s.has('view')).length
  const engaged = Array.from(visitorJourney.values()).filter(s => s.has('engaged') || s.has('scroll') || s.has('click')).length
  const converted = Array.from(visitorJourney.values()).filter(s => s.has('conversion') || s.has('lead_capture')).length

  return {
    steps: [
      { name: 'Visited', count: totalVisitors, rate: 100 },
      { name: 'Viewed', count: viewed, rate: totalVisitors > 0 ? Math.round((viewed / totalVisitors) * 100) : 0 },
      { name: 'Engaged', count: engaged, rate: totalVisitors > 0 ? Math.round((engaged / totalVisitors) * 100) : 0 },
      { name: 'Converted', count: converted, rate: totalVisitors > 0 ? Math.round((converted / totalVisitors) * 100) : 0 },
    ],
    conversionRate: totalVisitors > 0 ? Math.round((converted / totalVisitors) * 100 * 10) / 10 : 0,
  }
}

function getDemoAnalytics() {
  const days = 30
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Generate demo daily stats
  const dailyStats = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dailyStats.push({
      date: current.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 50) + 10,
      uniqueVisitors: Math.floor(Math.random() * 30) + 5,
    })
    current.setDate(current.getDate() + 1)
  }

  // Generate hourly stats
  const hourlyStats = []
  for (let i = 0; i < 24; i++) {
    // More traffic during business hours
    const baseTraffic = (i >= 9 && i <= 17) ? 40 : 15
    hourlyStats.push({
      hour: i,
      count: Math.floor(Math.random() * baseTraffic) + 5,
    })
  }

  return {
    document: {
      id: 'demo',
      slug: 'demo-document',
      title: 'Demo Document',
      totalViews: 1234,
    },
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days,
    },
    summary: {
      views: 847,
      uniqueVisitors: 412,
      avgViewsPerDay: 28.2,
      viewsTrend: 12.5,
      visitorsTrend: 8.3,
      bounceRate: 42,
      avgTimeOnPage: 127,
      avgScrollDepth: 68,
    },
    dailyStats,
    hourlyStats,
    referrerStats: [
      { source: 'google.com', count: 234 },
      { source: 'linkedin.com', count: 156 },
      { source: 'twitter.com', count: 98 },
      { source: 'direct', count: 359 },
    ],
    geoStats: [
      { country: 'United States', count: 456 },
      { country: 'United Kingdom', count: 123 },
      { country: 'Germany', count: 89 },
      { country: 'Canada', count: 67 },
      { country: 'Australia', count: 45 },
    ],
    deviceStats: [
      { device: 'Desktop', count: 523, percentage: 62 },
      { device: 'Mobile', count: 268, percentage: 32 },
      { device: 'Tablet', count: 56, percentage: 6 },
    ],
    browserStats: [
      { browser: 'Chrome', count: 412, percentage: 49 },
      { browser: 'Safari', count: 234, percentage: 28 },
      { browser: 'Firefox', count: 98, percentage: 12 },
      { browser: 'Edge', count: 67, percentage: 8 },
      { browser: 'Other', count: 36, percentage: 3 },
    ],
    engagementStats: {
      bounceRate: 42,
      avgTimeOnPage: 127,
      avgScrollDepth: 68,
      totalViews: 847,
      engagedViews: 492,
      engagementRate: 58,
    },
    funnelStats: {
      steps: [
        { name: 'Visited', count: 847, rate: 100 },
        { name: 'Viewed', count: 812, rate: 96 },
        { name: 'Engaged', count: 492, rate: 58 },
        { name: 'Converted', count: 78, rate: 9 },
      ],
      conversionRate: 9.2,
    },
  }
}
