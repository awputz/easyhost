'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Eye,
  Download,
  Users,
  Code,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AssetAnalyticsData {
  asset: {
    id: string
    filename: string
    mime_type: string
    size_bytes: number
    view_count: number
    download_count: number
    created_at: string
  }
  overview: {
    total_views: number
    total_downloads: number
    unique_visitors: number
    embed_loads: number
    avg_views_per_day: number
  }
  views_over_time: {
    date: string
    views: number
    downloads: number
  }[]
  recent_events: {
    id: string
    event_type: string
    country_name: string | null
    city: string | null
    referrer: string | null
    created_at: string
  }[]
  top_referrers: {
    referrer: string
    visits: number
  }[]
  embed_locations: {
    domain: string
    embeds: number
  }[]
}

export default function AssetAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: assetId } = use(params)
  const [data, setData] = useState<AssetAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/assets/${assetId}?days=${days}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Failed to load asset analytics')
      }
    } catch (error) {
      console.error('Failed to fetch asset analytics:', error)
      toast.error('Failed to load asset analytics')
    } finally {
      setLoading(false)
    }
  }, [assetId, days])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const chartData = data?.views_over_time.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM d'),
  })) || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/analytics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {loading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              data?.asset.filename || 'Asset Analytics'
            )}
          </h1>
          {!loading && data && (
            <p className="text-muted-foreground">
              {data.asset.mime_type} · {formatBytes(data.asset.size_bytes)} ·
              Uploaded {formatDistanceToNow(parseISO(data.asset.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : data ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Eye className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-xl font-bold">{data.overview.total_views.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Download className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="text-xl font-bold">{data.overview.total_downloads.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-xl font-bold">{data.overview.unique_visitors.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Code className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Embed Loads</p>
                    <p className="text-xl font-bold">{data.overview.embed_loads.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <Clock className="h-4 w-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg/Day</p>
                    <p className="text-xl font-bold">{data.overview.avg_views_per_day.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Views chart */}
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorViewsAsset" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="formattedDate"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3">
                            <p className="font-medium mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value?.toLocaleString()}
                              </p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorViewsAsset)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.top_referrers.length > 0 ? (
                  <div className="space-y-3">
                    {data.top_referrers.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {item.referrer}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(item.visits / (data.top_referrers[0]?.visits || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.visits}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No referrer data</p>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent_events.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {data.recent_events.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 text-sm">
                        <Badge
                          variant={event.event_type === 'download' ? 'default' : 'secondary'}
                          className="w-20 justify-center"
                        >
                          {event.event_type}
                        </Badge>
                        <span className="flex-1 text-muted-foreground truncate">
                          {[event.city, event.country_name].filter(Boolean).join(', ') || 'Unknown location'}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(parseISO(event.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Asset not found</p>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
