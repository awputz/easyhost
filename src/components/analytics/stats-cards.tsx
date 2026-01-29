'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Eye, Download, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  totalViews: number
  totalDownloads: number
  uniqueVisitors: number
  avgViewsPerDay: number
  viewsChange: number
  downloadsChange: number
  visitorsChange: number
}

export function StatsCards({
  totalViews,
  totalDownloads,
  uniqueVisitors,
  avgViewsPerDay,
  viewsChange,
  downloadsChange,
  visitorsChange,
}: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Views',
      value: formatNumber(totalViews),
      change: viewsChange,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Downloads',
      value: formatNumber(totalDownloads),
      change: downloadsChange,
      icon: Download,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Unique Visitors',
      value: formatNumber(uniqueVisitors),
      change: visitorsChange,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Avg. Views/Day',
      value: formatNumber(avgViewsPerDay),
      change: null,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                {stat.change !== null && (
                  <div className="flex items-center mt-1">
                    <ChangeIndicator change={stat.change} />
                  </div>
                )}
              </div>
              <div className={cn('p-3 rounded-full', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-1" />
        No change
      </span>
    )
  }

  const isPositive = change > 0
  return (
    <span className={cn(
      'flex items-center text-xs',
      isPositive ? 'text-green-500' : 'text-red-500'
    )}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3 mr-1" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-1" />
      )}
      {Math.abs(change).toFixed(1)}% vs previous
    </span>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
