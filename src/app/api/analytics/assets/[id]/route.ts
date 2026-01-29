import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

// Demo data for individual asset analytics
function generateDemoAssetAnalytics(assetId: string, days: number) {
  const now = new Date()
  const viewsOverTime = []

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i)
    const baseViews = Math.floor(Math.random() * 30) + 10
    const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.6 : 1
    viewsOverTime.push({
      date: format(date, 'yyyy-MM-dd'),
      views: Math.floor(baseViews * weekendMultiplier),
      downloads: Math.floor((baseViews * weekendMultiplier) * 0.2),
    })
  }

  const totalViews = viewsOverTime.reduce((sum, d) => sum + d.views, 0)
  const totalDownloads = viewsOverTime.reduce((sum, d) => sum + d.downloads, 0)

  // Recent events
  const recentEvents = []
  for (let i = 0; i < 20; i++) {
    recentEvents.push({
      id: `event-${i}`,
      event_type: Math.random() > 0.8 ? 'download' : 'view',
      country_name: ['United States', 'United Kingdom', 'Germany', 'Canada'][Math.floor(Math.random() * 4)],
      city: ['New York', 'London', 'Berlin', 'Toronto', 'San Francisco'][Math.floor(Math.random() * 5)],
      referrer: ['', 'google.com', 'twitter.com', 'linkedin.com'][Math.floor(Math.random() * 4)] || null,
      created_at: new Date(now.getTime() - Math.random() * days * 86400000).toISOString(),
    })
  }
  recentEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Top referrers
  const referrers = [
    { referrer: 'Direct', visits: Math.floor(totalViews * 0.4) },
    { referrer: 'google.com', visits: Math.floor(totalViews * 0.25) },
    { referrer: 'twitter.com', visits: Math.floor(totalViews * 0.15) },
    { referrer: 'linkedin.com', visits: Math.floor(totalViews * 0.1) },
    { referrer: 'Other', visits: Math.floor(totalViews * 0.1) },
  ]

  // Embedding locations
  const embedLocations = [
    { domain: 'company-website.com', embeds: 45 },
    { domain: 'partner-site.io', embeds: 23 },
    { domain: 'blog.example.com', embeds: 12 },
  ]

  return {
    asset: {
      id: assetId,
      filename: 'demo-asset.png',
      mime_type: 'image/png',
      size_bytes: 245000,
      view_count: totalViews,
      download_count: totalDownloads,
      created_at: subDays(now, 30).toISOString(),
    },
    overview: {
      total_views: totalViews,
      total_downloads: totalDownloads,
      unique_visitors: Math.floor(totalViews * 0.65),
      embed_loads: Math.floor(totalViews * 0.15),
      avg_views_per_day: Math.round(totalViews / days),
    },
    views_over_time: viewsOverTime,
    recent_events: recentEvents,
    top_referrers: referrers,
    embed_locations: embedLocations,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(generateDemoAssetAnalytics(assetId, days))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(generateDemoAssetAnalytics(assetId, days))
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(generateDemoAssetAnalytics(assetId, days))
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

    // Get asset details
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('workspace_id', workspaceId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    const rangeStart = subDays(now, days)

    // Fetch analytics events for this asset
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('asset_id', assetId)
      .gte('created_at', startOfDay(rangeStart).toISOString())
      .lte('created_at', endOfDay(now).toISOString())
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('Failed to fetch asset analytics:', eventsError)
      return NextResponse.json(generateDemoAssetAnalytics(assetId, days))
    }

    // Process events
    const analytics = processAssetEvents(events || [], days, rangeStart, now)

    // Get recent events
    const recentEvents = (events || []).slice(0, 20).map(e => ({
      id: e.id,
      event_type: e.event_type,
      country_name: e.country_name,
      city: e.city,
      referrer: e.referrer,
      created_at: e.created_at,
    }))

    return NextResponse.json({
      asset: {
        id: asset.id,
        filename: asset.filename,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
        view_count: asset.view_count,
        download_count: asset.download_count,
        created_at: asset.created_at,
      },
      ...analytics,
      recent_events: recentEvents,
    })
  } catch (error) {
    console.error('Asset analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface AnalyticsEvent {
  id: string
  event_type: string
  referrer: string | null
  created_at: string
}

function processAssetEvents(
  events: AnalyticsEvent[],
  days: number,
  rangeStart: Date,
  rangeEnd: Date
) {
  // Group events by date
  const byDate: Record<string, { views: number; downloads: number }> = {}

  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const date = format(subDays(rangeEnd, days - 1 - i), 'yyyy-MM-dd')
    byDate[date] = { views: 0, downloads: 0 }
  }

  // Referrer tracking
  const referrerCount: Record<string, number> = {}

  let totalViews = 0
  let totalDownloads = 0
  let embedLoads = 0
  const uniqueVisitors = new Set<string>()

  for (const event of events) {
    const date = format(new Date(event.created_at), 'yyyy-MM-dd')
    if (!byDate[date]) continue

    if (event.event_type === 'view') {
      byDate[date].views++
      totalViews++
    } else if (event.event_type === 'download') {
      byDate[date].downloads++
      totalDownloads++
    } else if (event.event_type === 'embed_load') {
      embedLoads++
    }

    // Track referrer
    const referrer = event.referrer || 'Direct'
    referrerCount[referrer] = (referrerCount[referrer] || 0) + 1
  }

  // Convert to arrays
  const viewsOverTime = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      views: data.views,
      downloads: data.downloads,
    }))

  // Top referrers
  const topReferrers = Object.entries(referrerCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([referrer, visits]) => ({ referrer, visits }))

  return {
    overview: {
      total_views: totalViews,
      total_downloads: totalDownloads,
      unique_visitors: uniqueVisitors.size,
      embed_loads: embedLoads,
      avg_views_per_day: Math.round(totalViews / days),
    },
    views_over_time: viewsOverTime,
    top_referrers: topReferrers.length > 0 ? topReferrers : [{ referrer: 'Direct', visits: 0 }],
    embed_locations: [],
  }
}
