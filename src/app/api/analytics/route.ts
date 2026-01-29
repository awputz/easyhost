import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

// Demo analytics data
function generateDemoAnalytics(days: number) {
  const now = new Date()
  const viewsOverTime = []
  const topAssets = [
    { id: '1', filename: 'product-hero.png', views: 1247, downloads: 89 },
    { id: '2', filename: 'pricing-table.pdf', views: 892, downloads: 234 },
    { id: '3', filename: 'demo-video.mp4', views: 654, downloads: 45 },
    { id: '4', filename: 'logo-dark.svg', views: 543, downloads: 321 },
    { id: '5', filename: 'team-photo.jpg', views: 432, downloads: 67 },
  ]

  const topLinks = [
    { id: '1', slug: 'abc123', target: 'product-hero.png', views: 567, unique_visitors: 423 },
    { id: '2', slug: 'xyz789', target: 'pricing-table.pdf', views: 345, unique_visitors: 298 },
    { id: '3', slug: 'demo01', target: 'demo-video.mp4', views: 234, unique_visitors: 187 },
  ]

  const topCollections = [
    { id: '1', name: 'Q4 Marketing Assets', slug: 'q4-marketing', views: 234, items: 12 },
    { id: '2', name: 'Product Launch 2024', slug: 'product-launch', views: 187, items: 8 },
    { id: '3', name: 'Brand Guidelines', slug: 'brand-guide', views: 156, items: 15 },
  ]

  // Generate time series data
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i)
    const baseViews = Math.floor(Math.random() * 100) + 50
    const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.6 : 1
    viewsOverTime.push({
      date: format(date, 'yyyy-MM-dd'),
      views: Math.floor(baseViews * weekendMultiplier),
      downloads: Math.floor((baseViews * weekendMultiplier) * 0.15),
      unique_visitors: Math.floor((baseViews * weekendMultiplier) * 0.7),
    })
  }

  const totalViews = viewsOverTime.reduce((sum, d) => sum + d.views, 0)
  const totalDownloads = viewsOverTime.reduce((sum, d) => sum + d.downloads, 0)
  const totalVisitors = viewsOverTime.reduce((sum, d) => sum + d.unique_visitors, 0)

  // Traffic sources
  const trafficSources = [
    { source: 'Direct', visits: Math.floor(totalViews * 0.35), percentage: 35 },
    { source: 'Google', visits: Math.floor(totalViews * 0.25), percentage: 25 },
    { source: 'Twitter', visits: Math.floor(totalViews * 0.15), percentage: 15 },
    { source: 'LinkedIn', visits: Math.floor(totalViews * 0.12), percentage: 12 },
    { source: 'Email', visits: Math.floor(totalViews * 0.08), percentage: 8 },
    { source: 'Other', visits: Math.floor(totalViews * 0.05), percentage: 5 },
  ]

  // Device breakdown
  const devices = [
    { device: 'Desktop', visits: Math.floor(totalViews * 0.58), percentage: 58 },
    { device: 'Mobile', visits: Math.floor(totalViews * 0.35), percentage: 35 },
    { device: 'Tablet', visits: Math.floor(totalViews * 0.07), percentage: 7 },
  ]

  // Browser breakdown
  const browsers = [
    { browser: 'Chrome', visits: Math.floor(totalViews * 0.64), percentage: 64 },
    { browser: 'Safari', visits: Math.floor(totalViews * 0.19), percentage: 19 },
    { browser: 'Firefox', visits: Math.floor(totalViews * 0.08), percentage: 8 },
    { browser: 'Edge', visits: Math.floor(totalViews * 0.06), percentage: 6 },
    { browser: 'Other', visits: Math.floor(totalViews * 0.03), percentage: 3 },
  ]

  // Geographic data
  const countries = [
    { country: 'United States', code: 'US', visits: Math.floor(totalViews * 0.42), percentage: 42 },
    { country: 'United Kingdom', code: 'GB', visits: Math.floor(totalViews * 0.15), percentage: 15 },
    { country: 'Germany', code: 'DE', visits: Math.floor(totalViews * 0.12), percentage: 12 },
    { country: 'Canada', code: 'CA', visits: Math.floor(totalViews * 0.09), percentage: 9 },
    { country: 'Australia', code: 'AU', visits: Math.floor(totalViews * 0.07), percentage: 7 },
    { country: 'France', code: 'FR', visits: Math.floor(totalViews * 0.05), percentage: 5 },
    { country: 'Other', code: 'XX', visits: Math.floor(totalViews * 0.10), percentage: 10 },
  ]

  return {
    overview: {
      total_views: totalViews,
      total_downloads: totalDownloads,
      unique_visitors: totalVisitors,
      avg_views_per_day: Math.round(totalViews / days),
      views_change: 12.5, // percentage change from previous period
      downloads_change: 8.3,
      visitors_change: 15.2,
    },
    views_over_time: viewsOverTime,
    top_assets: topAssets,
    top_links: topLinks,
    top_collections: topCollections,
    traffic_sources: trafficSources,
    devices,
    browsers,
    countries,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Return demo data
      return NextResponse.json(generateDemoAnalytics(days))
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(generateDemoAnalytics(days))
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(generateDemoAnalytics(days))
    }

    // Get user's workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json(generateDemoAnalytics(days))
    }

    const workspaceId = workspace.id as string

    // Calculate date range
    const now = new Date()
    const rangeStart = startDate ? new Date(startDate) : subDays(now, days)
    const rangeEnd = endDate ? new Date(endDate) : now

    // Fetch analytics events
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfDay(rangeStart).toISOString())
      .lte('created_at', endOfDay(rangeEnd).toISOString())

    if (eventsError) {
      console.error('Failed to fetch analytics:', eventsError)
      return NextResponse.json(generateDemoAnalytics(days))
    }

    // Process events into analytics
    const analytics = processAnalyticsEvents(events || [], days, rangeStart, rangeEnd)

    // Fetch top assets
    const { data: topAssets } = await supabase
      .from('assets')
      .select('id, filename, view_count, download_count')
      .eq('workspace_id', workspaceId)
      .order('view_count', { ascending: false })
      .limit(10)

    // Fetch top links
    const { data: topLinks } = await supabase
      .from('short_links')
      .select('id, slug, view_count, asset:assets(filename), collection:collections(name)')
      .eq('workspace_id', workspaceId)
      .order('view_count', { ascending: false })
      .limit(10)

    // Fetch top collections
    const { data: topCollections } = await supabase
      .from('collections')
      .select('id, name, slug, view_count')
      .eq('workspace_id', workspaceId)
      .order('view_count', { ascending: false })
      .limit(10)

    return NextResponse.json({
      ...analytics,
      top_assets: topAssets?.map(a => ({
        id: a.id,
        filename: a.filename,
        views: a.view_count,
        downloads: a.download_count,
      })) || [],
      top_links: topLinks?.map(l => {
        const asset = l.asset as unknown as { filename: string } | null
        const collection = l.collection as unknown as { name: string } | null
        return {
          id: l.id,
          slug: l.slug,
          target: asset?.filename || collection?.name || 'Unknown',
          views: l.view_count,
          unique_visitors: Math.floor(l.view_count * 0.7),
        }
      }) || [],
      top_collections: topCollections?.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        views: c.view_count,
      })) || [],
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface AnalyticsEvent {
  id: string
  workspace_id: string
  asset_id: string | null
  short_link_id: string | null
  collection_id: string | null
  event_type: string
  visitor_id: string | null
  ip_address: string | null
  user_agent: string | null
  country_code: string | null
  country_name: string | null
  city: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

function processAnalyticsEvents(
  events: AnalyticsEvent[],
  days: number,
  rangeStart: Date,
  rangeEnd: Date
) {
  // Group events by date
  const byDate: Record<string, { views: number; downloads: number; visitors: Set<string> }> = {}

  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const date = format(subDays(rangeEnd, days - 1 - i), 'yyyy-MM-dd')
    byDate[date] = { views: 0, downloads: 0, visitors: new Set() }
  }

  // Traffic sources
  const sourceCount: Record<string, number> = {}
  // Country count
  const countryCount: Record<string, { name: string; visits: number }> = {}
  // Device/browser detection from user agent
  const deviceCount: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 }
  const browserCount: Record<string, number> = {}

  const uniqueVisitors = new Set<string>()

  for (const event of events) {
    const date = format(new Date(event.created_at), 'yyyy-MM-dd')
    if (!byDate[date]) continue

    if (event.event_type === 'view' || event.event_type === 'embed_load') {
      byDate[date].views++
    } else if (event.event_type === 'download') {
      byDate[date].downloads++
    }

    if (event.visitor_id) {
      byDate[date].visitors.add(event.visitor_id)
      uniqueVisitors.add(event.visitor_id)
    }

    // Track traffic source
    const source = categorizeReferrer(event.referrer, event.utm_source)
    sourceCount[source] = (sourceCount[source] || 0) + 1

    // Track country
    if (event.country_code && event.country_name) {
      if (!countryCount[event.country_code]) {
        countryCount[event.country_code] = { name: event.country_name, visits: 0 }
      }
      countryCount[event.country_code].visits++
    }

    // Parse user agent for device/browser
    if (event.user_agent) {
      const { device, browser } = parseUserAgent(event.user_agent)
      deviceCount[device] = (deviceCount[device] || 0) + 1
      browserCount[browser] = (browserCount[browser] || 0) + 1
    }
  }

  // Calculate totals
  const totalViews = Object.values(byDate).reduce((sum, d) => sum + d.views, 0)
  const totalDownloads = Object.values(byDate).reduce((sum, d) => sum + d.downloads, 0)

  // Convert to arrays
  const viewsOverTime = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      views: data.views,
      downloads: data.downloads,
      unique_visitors: data.visitors.size,
    }))

  // Traffic sources as array
  const totalSourceVisits = Object.values(sourceCount).reduce((sum, v) => sum + v, 0) || 1
  const trafficSources = Object.entries(sourceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([source, visits]) => ({
      source,
      visits,
      percentage: Math.round((visits / totalSourceVisits) * 100),
    }))

  // Countries as array
  const totalCountryVisits = Object.values(countryCount).reduce((sum, v) => sum + v.visits, 0) || 1
  const countries = Object.entries(countryCount)
    .sort(([, a], [, b]) => b.visits - a.visits)
    .slice(0, 7)
    .map(([code, data]) => ({
      country: data.name,
      code,
      visits: data.visits,
      percentage: Math.round((data.visits / totalCountryVisits) * 100),
    }))

  // Devices as array
  const totalDeviceVisits = Object.values(deviceCount).reduce((sum, v) => sum + v, 0) || 1
  const devices = Object.entries(deviceCount)
    .sort(([, a], [, b]) => b - a)
    .map(([device, visits]) => ({
      device,
      visits,
      percentage: Math.round((visits / totalDeviceVisits) * 100),
    }))

  // Browsers as array
  const totalBrowserVisits = Object.values(browserCount).reduce((sum, v) => sum + v, 0) || 1
  const browsers = Object.entries(browserCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([browser, visits]) => ({
      browser,
      visits,
      percentage: Math.round((visits / totalBrowserVisits) * 100),
    }))

  return {
    overview: {
      total_views: totalViews,
      total_downloads: totalDownloads,
      unique_visitors: uniqueVisitors.size,
      avg_views_per_day: Math.round(totalViews / days),
      views_change: 0, // Would need previous period data to calculate
      downloads_change: 0,
      visitors_change: 0,
    },
    views_over_time: viewsOverTime,
    traffic_sources: trafficSources.length > 0 ? trafficSources : [{ source: 'Direct', visits: 0, percentage: 100 }],
    devices: devices.filter(d => d.visits > 0),
    browsers: browsers.filter(b => b.visits > 0),
    countries: countries.length > 0 ? countries : [],
  }
}

function categorizeReferrer(referrer: string | null, utmSource: string | null): string {
  if (utmSource) {
    return utmSource.charAt(0).toUpperCase() + utmSource.slice(1)
  }

  if (!referrer) return 'Direct'

  const ref = referrer.toLowerCase()
  if (ref.includes('google')) return 'Google'
  if (ref.includes('bing')) return 'Bing'
  if (ref.includes('twitter') || ref.includes('t.co')) return 'Twitter'
  if (ref.includes('linkedin')) return 'LinkedIn'
  if (ref.includes('facebook')) return 'Facebook'
  if (ref.includes('instagram')) return 'Instagram'
  if (ref.includes('youtube')) return 'YouTube'

  return 'Other'
}

function parseUserAgent(ua: string): { device: string; browser: string } {
  const uaLower = ua.toLowerCase()

  // Device detection
  let device = 'Desktop'
  if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
    device = 'Mobile'
  } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
    device = 'Tablet'
  }

  // Browser detection
  let browser = 'Other'
  if (uaLower.includes('chrome') && !uaLower.includes('edg')) {
    browser = 'Chrome'
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
    browser = 'Safari'
  } else if (uaLower.includes('firefox')) {
    browser = 'Firefox'
  } else if (uaLower.includes('edg')) {
    browser = 'Edge'
  }

  return { device, browser }
}
