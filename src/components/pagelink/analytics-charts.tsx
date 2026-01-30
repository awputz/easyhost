'use client'

import { useMemo } from 'react'

// Simple Line Chart
interface LineChartProps {
  data: { date: string; value: number }[]
  height?: number
  color?: string
  showArea?: boolean
}

export function LineChart({
  data,
  height = 200,
  color = '#3B82F6',
  showArea = true,
}: LineChartProps) {
  const { points, areaPath, linePath, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: '', linePath: '', maxValue: 0, minValue: 0 }

    const values = data.map(d => d.value)
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)

    const padding = 10
    const chartWidth = 100 // percentage
    const chartHeight = height - padding * 2

    const pts = data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * chartWidth,
      y: padding + (1 - (d.value - min) / (max - min || 1)) * chartHeight,
      value: d.value,
      date: d.date,
    }))

    const linePoints = pts.map(p => `${p.x}%,${p.y}`).join(' ')
    const areaPoints = `0%,${height} ${linePoints} 100%,${height}`

    return {
      points: pts,
      linePath: linePoints,
      areaPath: areaPoints,
      maxValue: max,
      minValue: min,
    }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-zinc-500 text-sm"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      <svg
        width="100%"
        height={height}
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        {showArea && (
          <polygon
            points={areaPath}
            fill={`${color}20`}
            className="transition-all duration-300"
          />
        )}
        <polyline
          points={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-300"
        />
        {points.map((point, i) => (
          <circle
            key={i}
            cx={`${point.x}%`}
            cy={point.y}
            r="4"
            fill={color}
            className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <title>{`${point.date}: ${point.value}`}</title>
          </circle>
        ))}
      </svg>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-zinc-500 -ml-8">
        <span>{maxValue}</span>
        <span>{Math.round((maxValue + minValue) / 2)}</span>
        <span>{minValue}</span>
      </div>
    </div>
  )
}

// Bar Chart
interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  orientation?: 'vertical' | 'horizontal'
  showValues?: boolean
}

export function BarChart({
  data,
  height = 200,
  orientation = 'vertical',
  showValues = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (orientation === 'horizontal') {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 truncate">{item.label}</span>
              {showValues && (
                <span className="text-white font-medium">{item.value}</span>
              )}
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#3B82F6',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const barWidth = 100 / data.length - 2

  return (
    <div className="relative" style={{ height }}>
      <div className="flex items-end justify-around h-full gap-1">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 group"
            style={{ width: `${barWidth}%` }}
          >
            {showValues && (
              <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value}
              </span>
            )}
            <div
              className="w-full rounded-t transition-all duration-500 cursor-pointer hover:opacity-80"
              style={{
                height: `${(item.value / maxValue) * (height - 30)}px`,
                backgroundColor: item.color || '#3B82F6',
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-zinc-500 truncate max-w-full">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Donut Chart
interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({
  data,
  size = 150,
  strokeWidth = 20,
}: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / total
          const strokeDasharray = `${circumference * percentage} ${circumference}`
          const strokeDashoffset = -currentOffset * circumference
          currentOffset += percentage

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-zinc-400">{item.label}</span>
            <span className="text-sm text-white font-medium">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Funnel Chart
interface FunnelChartProps {
  data: { name: string; count: number; rate: number }[]
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = data[0]?.count || 1

  return (
    <div className="space-y-2">
      {data.map((step, index) => (
        <div key={index} className="relative">
          <div
            className="h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-500"
            style={{
              width: `${Math.max((step.count / maxCount) * 100, 30)}%`,
              backgroundColor: `rgba(59, 130, 246, ${1 - index * 0.2})`,
            }}
          >
            <span className="text-white font-medium">{step.name}</span>
            <span className="text-white/80 text-sm">{step.count}</span>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm">
            <span className="text-zinc-400">{step.rate}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Heatmap for hourly distribution
interface HeatmapProps {
  data: { hour: number; count: number }[]
}

export function HourlyHeatmap({ data }: HeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {data.map((item) => (
          <div
            key={item.hour}
            className="flex-1 h-8 rounded transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: `rgba(59, 130, 246, ${item.count / maxCount})`,
            }}
            title={`${item.hour}:00 - ${item.count} views`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>12am</span>
      </div>
    </div>
  )
}

// Stat Card with trend
interface StatCardProps {
  label: string
  value: string | number
  trend?: number | null
  icon?: React.ReactNode
  suffix?: string
}

export function StatCard({ label, value, trend, icon, suffix }: StatCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500">{label}</span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">
          {value}
          {suffix && <span className="text-sm text-zinc-500 ml-1">{suffix}</span>}
        </span>
        {trend !== null && trend !== undefined && (
          <span
            className={`text-sm font-medium ${
              trend >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  )
}

// World map placeholder (simplified)
interface MapChartProps {
  data: { country: string; count: number }[]
}

export function WorldMapChart({ data }: MapChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-6 text-center text-sm font-medium text-zinc-500">
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white">{item.country}</span>
              <span className="text-zinc-400">{item.count} views</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
