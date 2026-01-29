'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Image, Video, File, Eye, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopAssetsTableProps {
  assets: {
    id: string
    filename: string
    views: number
    downloads: number
  }[]
}

export function TopAssetsTable({ assets }: TopAssetsTableProps) {
  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No asset data available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              className="flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground w-6">
                {index + 1}.
              </span>
              <div className={cn(
                'p-2 rounded-lg',
                getFileIconBg(asset.filename)
              )}>
                {getFileIcon(asset.filename)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.filename}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {asset.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {asset.downloads.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(100, (asset.views / (assets[0]?.views || 1)) * 100)}%`,
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

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext || '')) {
    return <Image className="h-4 w-4 text-blue-500" />
  }
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
    return <Video className="h-4 w-4 text-purple-500" />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return <FileText className="h-4 w-4 text-orange-500" />
  }
  return <File className="h-4 w-4 text-gray-500" />
}

function getFileIconBg(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext || '')) {
    return 'bg-blue-500/10'
  }
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
    return 'bg-purple-500/10'
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return 'bg-orange-500/10'
  }
  return 'bg-gray-500/10'
}
