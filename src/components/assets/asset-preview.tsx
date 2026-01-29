'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Copy, Download, ExternalLink, Tag, Calendar, HardDrive, FileImage, FileVideo, FileText, FileCode, File, ChevronLeft, ChevronRight, History, BarChart3 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface AssetPreviewProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  assets?: Asset[]
  onNavigate?: (asset: Asset) => void
}

export function AssetPreview({
  asset,
  open,
  onOpenChange,
  assets = [],
  onNavigate,
}: AssetPreviewProps) {
  const [imageError, setImageError] = useState(false)

  if (!asset) return null

  const isImage = asset.mime_type.startsWith('image/')
  const isVideo = asset.mime_type.startsWith('video/')
  const isCode = asset.mime_type.includes('javascript') || asset.mime_type.includes('json') || asset.mime_type.includes('css') || asset.mime_type.includes('html')
  const isPdf = asset.mime_type === 'application/pdf'
  const isText = asset.mime_type.startsWith('text/')

  const currentIndex = assets.findIndex((a) => a.id === asset.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < assets.length - 1

  const getIcon = () => {
    if (isImage) return FileImage
    if (isVideo) return FileVideo
    if (isCode || asset.mime_type.includes('html')) return FileCode
    if (isPdf || isText) return FileText
    return File
  }

  const Icon = getIcon()

  const getPublicUrl = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}${asset.public_path}`
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
    if (asset.public_path.startsWith('/demo/')) {
      toast.info('Download not available in demo mode')
      return
    }
    window.open(getPublicUrl(), '_blank')
  }

  const navigatePrev = () => {
    if (hasPrev && onNavigate) {
      onNavigate(assets[currentIndex - 1])
    }
  }

  const navigateNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(assets[currentIndex + 1])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Preview area */}
          <div className="flex-1 bg-black/90 flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation arrows */}
            {assets.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
                  disabled={!hasPrev}
                  onClick={navigatePrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
                  disabled={!hasNext}
                  onClick={navigateNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Content */}
            {isImage && !imageError ? (
              <div className="relative w-full h-full min-h-[300px]">
                <Image
                  src={asset.storage_path.startsWith('demo/') ? '/placeholder-image.svg' : `/api/assets/${asset.id}/file`}
                  alt={asset.filename}
                  fill
                  className="object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : isVideo ? (
              <video
                src={`/api/assets/${asset.id}/file`}
                controls
                className="max-w-full max-h-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : isPdf ? (
              <iframe
                src={`/api/assets/${asset.id}/file`}
                className="w-full h-full min-h-[500px]"
                title={asset.filename}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white p-8">
                <Icon className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">{asset.filename}</p>
                <p className="text-sm opacity-70">{asset.mime_type}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-card border-l p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Filename */}
              <div>
                <h3 className="font-semibold text-lg break-words">{asset.filename}</h3>
                <p className="text-sm text-muted-foreground">{asset.mime_type}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={copyUrl} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button variant="outline" onClick={downloadAsset}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => window.open(getPublicUrl(), '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* URL */}
              <div>
                <p className="text-sm font-medium mb-1">Public URL</p>
                <div className="bg-muted rounded p-2 text-xs font-mono break-all">
                  {getPublicUrl()}
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Size:</span>
                  <span>{formatBytes(asset.size_bytes)}</span>
                </div>

                {(asset.width && asset.height) && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>{asset.width} × {asset.height}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span>{formatDate(asset.created_at)}</span>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-muted rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{asset.view_count}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{asset.download_count}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </div>

              <Separator />

              {/* Version History */}
              <VersionHistory assetId={asset.id} />

              {/* Analytics link */}
              <Link href={`/dashboard/analytics/asset/${asset.id}`}>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View detailed analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface Version {
  id: string
  version_number: number
  size_bytes: number
  note: string | null
  created_at: string
}

function VersionHistory({ assetId }: { assetId: string }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [assetId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" />
          Version History
        </div>
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" />
          Version History
        </div>
        <p className="text-xs text-muted-foreground">No previous versions</p>
      </div>
    )
  }

  const displayVersions = expanded ? versions : versions.slice(0, 3)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" />
          Version History
        </div>
        <span className="text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {displayVersions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <div>
              <span className="font-medium">v{version.version_number}</span>
              <span className="text-muted-foreground ml-2">
                {formatBytes(version.size_bytes)}
              </span>
              {version.note && (
                <p className="text-muted-foreground truncate max-w-[150px]">
                  {version.note}
                </p>
              )}
            </div>
            <span className="text-muted-foreground">
              {formatDate(version.created_at)}
            </span>
          </div>
        ))}
      </div>
      {versions.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-auto py-1 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show ${versions.length - 3} more`}
        </Button>
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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
