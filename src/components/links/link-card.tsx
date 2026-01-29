'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  QrCode,
  Lock,
  Calendar,
  Eye,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  FileText,
  FileImage,
  FileVideo,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { ShortLink } from '@/types'

interface LinkCardProps {
  link: ShortLink & {
    asset?: {
      id: string
      filename: string
      mime_type: string
      public_path: string
    } | null
    collection?: {
      id: string
      name: string
      slug: string
    } | null
  }
  onEdit?: (link: ShortLink) => void
  onDelete?: (link: ShortLink) => void
  onQRCode?: (link: ShortLink) => void
  onToggleActive?: (link: ShortLink, active: boolean) => void
}

export function LinkCard({
  link,
  onEdit,
  onDelete,
  onQRCode,
  onToggleActive,
}: LinkCardProps) {
  const [copying, setCopying] = useState(false)

  const shortUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${link.slug}`

  const copyUrl = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy')
    } finally {
      setCopying(false)
    }
  }

  const getIcon = (mimeType?: string) => {
    if (!mimeType) return File
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return FileText
    return File
  }

  const isExpired = link.expires_at && new Date(link.expires_at) < new Date()
  const isMaxViewsReached = link.max_views && link.view_count >= link.max_views
  const isDisabled = !link.is_active || isExpired || isMaxViewsReached

  const Icon = link.asset ? getIcon(link.asset.mime_type) : File

  return (
    <Card className={isDisabled ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate">
                  {link.asset?.filename || link.collection?.name || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  /e/{link.slug}
                </p>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!link.is_active && (
                  <Badge variant="secondary">Disabled</Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {isMaxViewsReached && (
                  <Badge variant="secondary">Max views</Badge>
                )}
                {link.password_hash && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {link.view_count} views
              </span>
              {link.expires_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {isExpired
                    ? 'Expired'
                    : `Expires ${formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}`}
                </span>
              )}
              {link.max_views && (
                <span className="flex items-center gap-1">
                  {link.view_count}/{link.max_views} max
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyUrl}
              disabled={copying}
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onQRCode?.(link)}
            >
              <QrCode className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(shortUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(link)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive?.(link, !link.is_active)}>
                  {link.is_active ? (
                    <>
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      Disable link
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      Enable link
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(link)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
