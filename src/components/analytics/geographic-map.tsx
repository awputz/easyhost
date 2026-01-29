'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe } from 'lucide-react'

interface GeographicMapProps {
  countries: {
    country: string
    code: string
    visits: number
    percentage: number
  }[]
}

// Country flag emoji helper
function getCountryFlag(code: string): string {
  if (code === 'XX') return ''
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function GeographicMap({ countries }: GeographicMapProps) {
  if (countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No geographic data available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Geographic Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {countries.map((item, index) => (
            <div key={item.code} className="flex items-center gap-3">
              <span className="text-lg w-8">
                {item.code !== 'XX' ? getCountryFlag(item.code) : ''}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.country}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.visits.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(item.visits / (countries[0]?.visits || 1)) * 100}%`,
                      opacity: 1 - (index * 0.1),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
