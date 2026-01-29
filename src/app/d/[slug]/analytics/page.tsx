'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  Users,
  TrendingUp,
  Globe,
  ExternalLink,
  Calendar,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  }
  dailyStats: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  referrerStats: Array<{
    source: string
    count: number
  }>
  geoStats: Array<{
    country: string
    count: number
  }>
}

export default function DocumentAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

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

  const maxViews = Math.max(...analytics.dailyStats.map(d => d.views), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/d/${slug}`}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{analytics.document.title}</h1>
              <p className="text-sm text-zinc-500">Analytics Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={Eye}
            label="Total Views"
            value={analytics.document.totalViews.toLocaleString()}
            subtext="All time"
          />
          <SummaryCard
            icon={BarChart3}
            label="Period Views"
            value={analytics.summary.views.toLocaleString()}
            subtext={`Last ${days} days`}
          />
          <SummaryCard
            icon={Users}
            label="Unique Visitors"
            value={analytics.summary.uniqueVisitors.toLocaleString()}
            subtext={`Last ${days} days`}
          />
          <SummaryCard
            icon={TrendingUp}
            label="Avg. Daily Views"
            value={analytics.summary.avgViewsPerDay.toString()}
            subtext={`Last ${days} days`}
          />
        </div>

        {/* Views Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Views Over Time
          </h2>

          <div className="h-64 flex items-end gap-1">
            {analytics.dailyStats.map((day, i) => {
              const height = (day.views / maxViews) * 100
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="relative w-full">
                    <div
                      className="w-full bg-blue-500/80 hover:bg-blue-400 rounded-t transition-colors cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                        <div className="font-medium">{formatDate(day.date)}</div>
                        <div className="text-zinc-400">{day.views} views</div>
                        <div className="text-zinc-400">{day.uniqueVisitors} visitors</div>
                      </div>
                    </div>
                  </div>
                  {/* Show date label for every 7th day or first/last */}
                  {(i === 0 || i === analytics.dailyStats.length - 1 || i % 7 === 0) && (
                    <div className="text-xs text-zinc-500 mt-2 transform -rotate-45 origin-top-left">
                      {formatShortDate(day.date)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Referrer Sources */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Traffic Sources
            </h2>

            {analytics.referrerStats.length === 0 ? (
              <p className="text-zinc-500 text-sm">No referrer data available yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.referrerStats.map((ref) => {
                  const percentage = (ref.count / analytics.summary.views) * 100
                  return (
                    <div key={ref.source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-300">
                          {ref.source === 'direct' ? 'Direct / Unknown' : ref.source}
                        </span>
                        <span className="text-zinc-500">
                          {ref.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Geographic Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Top Countries
            </h2>

            {analytics.geoStats.length === 0 ? (
              <p className="text-zinc-500 text-sm">No geographic data available yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.geoStats.map((geo) => {
                  const percentage = (geo.count / analytics.summary.views) * 100
                  return (
                    <div key={geo.country}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-300">{geo.country}</span>
                        <span className="text-zinc-500">
                          {geo.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Eye
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{subtext}</div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
