'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Globe,
  ExternalLink,
  Calendar,
  BarChart3,
  Loader2,
  Clock,
  MousePointer,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  BarChart,
  DonutChart,
  FunnelChart,
  HourlyHeatmap,
  StatCard,
  WorldMapChart,
} from '@/components/pagelink/analytics-charts'

interface AnalyticsData {
  document: {
    id: string
    slug: string
    title: string
    totalViews: number
  }
  period: {
    start: string
    end: string
    days: number
  }
  summary: {
    views: number
    uniqueVisitors: number
    avgViewsPerDay: number
    viewsTrend: number | null
    visitorsTrend: number | null
    bounceRate: number
    avgTimeOnPage: number
    avgScrollDepth: number
  }
  dailyStats: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  hourlyStats: Array<{
    hour: number
    count: number
  }>
  referrerStats: Array<{
    source: string
    count: number
  }>
  geoStats: Array<{
    country: string
    count: number
  }>
  deviceStats: Array<{
    device: string
    count: number
    percentage: number
  }>
  browserStats: Array<{
    browser: string
    count: number
    percentage: number
  }>
  engagementStats: {
    bounceRate: number
    avgTimeOnPage: number
    avgScrollDepth: number
    totalViews: number
    engagedViews: number
    engagementRate: number
  }
  funnelStats: {
    steps: Array<{
      name: string
      count: number
      rate: number
    }>
    conversionRate: number
  }
}

export default function DocumentAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'audience'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [slug, days])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pagelink/documents/${slug}/analytics?days=${days}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load analytics'}</p>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/d/${slug}`}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{analytics.document.title}</h1>
              <p className="text-sm text-zinc-500">Advanced Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              className="border-zinc-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Page
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(['overview', 'engagement', 'audience'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-zinc-500">Total Views</span>
                </div>
                <div className="text-2xl font-bold">
                  {analytics.document.totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">All time</div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-zinc-500">Period Views</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">
                    {analytics.summary.views.toLocaleString()}
                  </span>
                  {analytics.summary.viewsTrend !== null && (
                    <span className={`text-sm flex items-center ${
                      analytics.summary.viewsTrend >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {analytics.summary.viewsTrend >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(analytics.summary.viewsTrend)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-zinc-500">Unique Visitors</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">
                    {analytics.summary.uniqueVisitors.toLocaleString()}
                  </span>
                  {analytics.summary.visitorsTrend !== null && (
                    <span className={`text-sm flex items-center ${
                      analytics.summary.visitorsTrend >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {analytics.summary.visitorsTrend >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(analytics.summary.visitorsTrend)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-zinc-500">Avg. Daily</span>
                </div>
                <div className="text-2xl font-bold">
                  {analytics.summary.avgViewsPerDay}
                </div>
                <div className="text-xs text-zinc-500 mt-1">views/day</div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-500">Avg. Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatTime(analytics.summary.avgTimeOnPage)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">on page</div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-zinc-500">Bounce Rate</span>
                </div>
                <div className="text-2xl font-bold">
                  {analytics.summary.bounceRate}%
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {analytics.summary.bounceRate < 40 ? 'Good' : analytics.summary.bounceRate < 60 ? 'Average' : 'Needs work'}
                </div>
              </div>
            </div>

            {/* Views Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Views Over Time
              </h2>
              <div className="pl-10">
                <LineChart
                  data={analytics.dailyStats.map(d => ({ date: d.date, value: d.views }))}
                  height={250}
                  color="#3B82F6"
                  showArea={true}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-2 pl-10">
                <span>{formatShortDate(analytics.dailyStats[0]?.date)}</span>
                <span>{formatShortDate(analytics.dailyStats[analytics.dailyStats.length - 1]?.date)}</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Traffic Sources */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Traffic Sources
                </h2>
                <BarChart
                  data={analytics.referrerStats.map(r => ({
                    label: r.source === 'direct' ? 'Direct' : r.source,
                    value: r.count,
                    color: r.source === 'direct' ? '#6B7280' : '#3B82F6',
                  }))}
                  orientation="horizontal"
                />
              </div>

              {/* Geographic Stats */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-400" />
                  Top Countries
                </h2>
                <WorldMapChart data={analytics.geoStats} />
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Traffic by Hour
              </h2>
              <HourlyHeatmap data={analytics.hourlyStats} />
            </div>
          </>
        )}

        {activeTab === 'engagement' && (
          <>
            {/* Engagement Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Engagement Rate"
                value={`${analytics.engagementStats.engagementRate}%`}
                icon={<MousePointer className="w-4 h-4" />}
              />
              <StatCard
                label="Bounce Rate"
                value={`${analytics.engagementStats.bounceRate}%`}
                icon={<TrendingDown className="w-4 h-4" />}
              />
              <StatCard
                label="Avg. Time on Page"
                value={formatTime(analytics.engagementStats.avgTimeOnPage)}
                icon={<Clock className="w-4 h-4" />}
              />
              <StatCard
                label="Avg. Scroll Depth"
                value={`${analytics.engagementStats.avgScrollDepth}%`}
                icon={<BarChart3 className="w-4 h-4" />}
              />
            </div>

            {/* Funnel */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Conversion Funnel
                <span className="text-sm font-normal text-zinc-500 ml-2">
                  {analytics.funnelStats.conversionRate}% conversion rate
                </span>
              </h2>
              <FunnelChart data={analytics.funnelStats.steps} />
            </div>

            {/* Engagement Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Engagement Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Engaged Views</span>
                      <span className="text-white">{analytics.engagementStats.engagedViews}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${(analytics.engagementStats.engagedViews / analytics.engagementStats.totalViews) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Scroll Depth</span>
                      <span className="text-white">{analytics.engagementStats.avgScrollDepth}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${analytics.engagementStats.avgScrollDepth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Performance Tips</h2>
                <ul className="space-y-3 text-sm">
                  {analytics.engagementStats.bounceRate > 50 && (
                    <li className="flex items-start gap-2 text-amber-400">
                      <span className="mt-1">•</span>
                      High bounce rate - consider improving your opening content
                    </li>
                  )}
                  {analytics.engagementStats.avgScrollDepth < 50 && (
                    <li className="flex items-start gap-2 text-amber-400">
                      <span className="mt-1">•</span>
                      Low scroll depth - add engaging content or visuals
                    </li>
                  )}
                  {analytics.engagementStats.avgTimeOnPage < 60 && (
                    <li className="flex items-start gap-2 text-amber-400">
                      <span className="mt-1">•</span>
                      Short time on page - ensure content matches visitor expectations
                    </li>
                  )}
                  {analytics.engagementStats.bounceRate <= 50 &&
                    analytics.engagementStats.avgScrollDepth >= 50 &&
                    analytics.engagementStats.avgTimeOnPage >= 60 && (
                    <li className="flex items-start gap-2 text-green-400">
                      <span className="mt-1">•</span>
                      Great engagement metrics! Your content is performing well
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        {activeTab === 'audience' && (
          <>
            {/* Device & Browser */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Devices */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  Devices
                </h2>
                <DonutChart
                  data={analytics.deviceStats.map(d => ({
                    label: d.device,
                    value: d.count,
                    color: d.device === 'Desktop' ? '#3B82F6' :
                           d.device === 'Mobile' ? '#8B5CF6' :
                           '#10B981',
                  }))}
                />
              </div>

              {/* Browsers */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-400" />
                  Browsers
                </h2>
                <BarChart
                  data={analytics.browserStats.map(b => ({
                    label: b.browser,
                    value: b.count,
                    color: '#8B5CF6',
                  }))}
                  orientation="horizontal"
                />
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Geographic Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Top Countries</h3>
                  <WorldMapChart data={analytics.geoStats} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">Distribution</h3>
                  <DonutChart
                    data={analytics.geoStats.slice(0, 5).map((g, i) => ({
                      label: g.country,
                      value: g.count,
                      color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i],
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Traffic Sources Detail */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-green-400" />
                Traffic Sources
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3">
                        Source
                      </th>
                      <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider py-3">
                        Visitors
                      </th>
                      <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider py-3">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.referrerStats.map((ref) => (
                      <tr key={ref.source} className="border-b border-zinc-800/50">
                        <td className="py-3">
                          <span className="text-white">
                            {ref.source === 'direct' ? 'Direct / Unknown' : ref.source}
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-400">
                          {ref.count.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-zinc-400">
                            {((ref.count / analytics.summary.views) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
