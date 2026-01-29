'use client'

import { useState } from 'react'
import { FileImage, FileVideo, FileText, FileCode, File, MoreHorizontal, Copy, Download, Eye, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface AssetListProps {
  assets: Asset[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onPreview: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export function AssetList({
  assets,
  selectedIds,
  onSelect,
  onSelectAll,
  onPreview,
  onDelete,
}: AssetListProps) {
  const allSelected = assets.length > 0 && assets.every((a) => selectedIds.has(a.id))
  const someSelected = assets.some((a) => selectedIds.has(a.id))

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('css') || mimeType.includes('html')) return FileCode
    if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return FileText
    return File
  }

  const copyUrl = async (asset: Asset) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${asset.public_path}`)
      toast.success('URL copied to clipboard')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
          aria-label="Select all"
          className={cn(someSelected && !allSelected && 'data-[state=checked]:bg-primary/50')}
        />
        <span>Name</span>
        <span className="w-24 text-right">Size</span>
        <span className="w-28">Type</span>
        <span className="w-32">Modified</span>
        <span className="w-10" />
      </div>

      {/* Rows */}
      <div className="divide-y">
        {assets.map((asset) => {
          const Icon = getIcon(asset.mime_type)
          const isSelected = selectedIds.has(asset.id)

          return (
            <div
              key={asset.id}
              className={cn(
                'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 items-center hover:bg-muted/30 transition-colors',
                isSelected && 'bg-primary/5'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(asset.id, !!checked)}
                aria-label={`Select ${asset.filename}`}
              />

              <button
                className="flex items-center gap-3 min-w-0 text-left"
                onClick={() => onPreview(asset)}
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{asset.filename}</span>
              </button>

              <span className="w-24 text-right text-sm text-muted-foreground">
                {formatBytes(asset.size_bytes)}
              </span>

              <span className="w-28 text-sm text-muted-foreground truncate">
                {asset.mime_type.split('/')[1] || asset.mime_type}
              </span>

              <span className="w-32 text-sm text-muted-foreground">
                {formatDate(asset.updated_at)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(asset)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyUrl(asset)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`${window.location.origin}${asset.public_path}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(asset)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {assets.length === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          No assets found
        </div>
      )}
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
