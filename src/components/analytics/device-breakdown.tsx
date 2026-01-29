'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeviceBreakdownProps {
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
}

export function DeviceBreakdown({ devices, browsers }: DeviceBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices & Browsers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Devices */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Devices</p>
          <div className="space-y-3">
            {devices.map((item) => (
              <div key={item.device} className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  item.device === 'Desktop' ? 'bg-blue-500/10' :
                  item.device === 'Mobile' ? 'bg-green-500/10' : 'bg-purple-500/10'
                )}>
                  {item.device === 'Desktop' ? (
                    <Monitor className="h-4 w-4 text-blue-500" />
                  ) : item.device === 'Mobile' ? (
                    <Smartphone className="h-4 w-4 text-green-500" />
                  ) : (
                    <Tablet className="h-4 w-4 text-purple-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.device}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        item.device === 'Desktop' ? 'bg-blue-500' :
                        item.device === 'Mobile' ? 'bg-green-500' : 'bg-purple-500'
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Browsers</p>
          <div className="space-y-2">
            {browsers.map((item) => (
              <div key={item.browser} className="flex items-center justify-between">
                <span className="text-sm">{item.browser}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
