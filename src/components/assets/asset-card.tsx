'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FileImage, FileVideo, FileText, FileCode, File, Copy, Download, ExternalLink, MoreHorizontal, Trash2, Eye, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface AssetCardProps {
  asset: Asset
  selected?: boolean
  onSelect?: (asset: Asset) => void
  onPreview?: (asset: Asset) => void
  onDelete?: (asset: Asset) => void
  onCreateLink?: (asset: Asset) => void
}

export function AssetCard({
  asset,
  selected = false,
  onSelect,
  onPreview,
  onDelete,
  onCreateLink,
}: AssetCardProps) {
  const [imageError, setImageError] = useState(false)

  const isImage = asset.mime_type.startsWith('image/')
  const isVideo = asset.mime_type.startsWith('video/')
  const isCode = asset.mime_type.includes('javascript') || asset.mime_type.includes('json') || asset.mime_type.includes('css') || asset.mime_type.includes('html')
  const isPdf = asset.mime_type === 'application/pdf'
  const isText = asset.mime_type.startsWith('text/')

  const getIcon = () => {
    if (isImage) return FileImage
    if (isVideo) return FileVideo
    if (isCode || asset.mime_type.includes('html')) return FileCode
    if (isPdf || isText) return FileText
    return File
  }

  const Icon = getIcon()

  const getPublicUrl = () => {
    // In production, this would be the actual public URL
    if (asset.public_path.startsWith('/demo/')) {
      return `${window.location.origin}${asset.public_path}`
    }
    return `${window.location.origin}${asset.public_path}`
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getPublicUrl())
      toast.success('URL copied to clipboard')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const downloadAsset = () => {
    // For demo mode, just show a toast
    if (asset.public_path.startsWith('/demo/')) {
      toast.info('Download not available in demo mode')
      return
    }
    // In production, trigger download
    window.open(getPublicUrl(), '_blank')
  }

  return (
    <div
      className={cn(
        'group relative bg-card border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg',
        selected && 'ring-2 ring-primary border-primary'
      )}
      onClick={() => onSelect?.(asset)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {isImage && !imageError ? (
          <Image
            src={asset.storage_path.startsWith('demo/') ? '/placeholder-image.svg' : `/api/assets/${asset.id}/thumbnail`}
            alt={asset.filename}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Icon className="h-12 w-12 text-muted-foreground" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onPreview?.(asset)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              copyUrl()
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              downloadAsset()
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" title={asset.filename}>
              {asset.filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(asset.size_bytes)}
            </p>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview?.(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsset}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(getPublicUrl(), '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateLink?.(asset)}>
                <Link2 className="mr-2 h-4 w-4" />
                Create short link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(asset)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
