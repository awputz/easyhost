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

    // Calculate totals
    const totalViews = events?.filter(e => e.event_type === 'view').length || 0
    const uniqueVisitors = new Set(events?.map(e => e.visitor_id).filter(Boolean)).size

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
      },
      dailyStats,
      referrerStats,
      geoStats,
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
    },
    dailyStats,
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
    ],
  }
}
