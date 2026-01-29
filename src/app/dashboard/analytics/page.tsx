'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { StatsCards } from '@/components/analytics/stats-cards'
import { ViewsChart } from '@/components/analytics/views-chart'
import { TopAssetsTable } from '@/components/analytics/top-assets-table'
import { TopLinksTable } from '@/components/analytics/top-links-table'
import { TopCollectionsTable } from '@/components/analytics/top-collections-table'
import { TrafficSources } from '@/components/analytics/traffic-sources'
import { DeviceBreakdown } from '@/components/analytics/device-breakdown'
import { GeographicMap } from '@/components/analytics/geographic-map'
import { DateRangePicker } from '@/components/analytics/date-range-picker'

interface AnalyticsData {
  overview: {
    total_views: number
    total_downloads: number
    unique_visitors: number
    avg_views_per_day: number
    views_change: number
    downloads_change: number
    visitors_change: number
  }
  views_over_time: {
    date: string
    views: number
    downloads: number
    unique_visitors: number
  }[]
  top_assets: {
    id: string
    filename: string
    views: number
    downloads: number
  }[]
  top_links: {
    id: string
    slug: string
    target: string
    views: number
    unique_visitors: number
  }[]
  top_collections: {
    id: string
    name: string
    slug: string
    views: number
    items?: number
  }[]
  traffic_sources: {
    source: string
    visits: number
    percentage: number
  }[]
  devices: {
    device: string
    visits: number
    percentage: number
  }[]
  browsers: {
    browser: string
    visits: number
    percentage: number
  }[]
  countries: {
    country: string
    code: string
    visits: number
    percentage: number
  }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [exporting, setExporting] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?days=${days}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const response = await fetch(`/api/analytics/export?days=${days}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${days}days.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Analytics exported as ${format.toUpperCase()}`)
      } else {
        toast.error('Failed to export analytics')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export analytics')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track views, downloads, and engagement across your assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={days} onChange={setDays} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAnalytics()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : data ? (
        <>
          {/* Stats cards */}
          <StatsCards
            totalViews={data.overview.total_views}
            totalDownloads={data.overview.total_downloads}
            uniqueVisitors={data.overview.unique_visitors}
            avgViewsPerDay={data.overview.avg_views_per_day}
            viewsChange={data.overview.views_change}
            downloadsChange={data.overview.downloads_change}
            visitorsChange={data.overview.visitors_change}
          />

          {/* Views chart */}
          <ViewsChart data={data.views_over_time} />

          {/* Top content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopAssetsTable assets={data.top_assets} />
            <TopLinksTable links={data.top_links} />
            <TopCollectionsTable collections={data.top_collections} />
          </div>

          {/* Traffic & Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TrafficSources data={data.traffic_sources} />
            <DeviceBreakdown
              devices={data.devices}
              browsers={data.browsers}
            />
            <GeographicMap countries={data.countries} />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      {/* Tables skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
