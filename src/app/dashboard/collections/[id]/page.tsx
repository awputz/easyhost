'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Trash2,
  GripVertical,
  ExternalLink,
  Copy,
  Settings,
  Eye,
  FileImage,
  FileVideo,
  FileText,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateCollectionModal } from '@/components/collections/create-collection-modal'
import { AddAssetsModal } from '@/components/collections/add-assets-modal'
import type { Collection, Asset } from '@/types'

interface CollectionItem {
  id: string
  position: number
  custom_title: string | null
  asset: Asset
}

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addAssetsOpen, setAddAssetsOpen] = useState(false)

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`)
      if (response.ok) {
        const data = await response.json()
        setCollection(data.collection)
        setItems(data.items || [])
      } else {
        router.push('/dashboard/collections')
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error)
      router.push('/dashboard/collections')
    } finally {
      setLoading(false)
    }
  }, [collectionId, router])

  useEffect(() => {
    fetchCollection()
  }, [fetchCollection])

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/items?item_id=${itemId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Item removed')
        fetchCollection()
      }
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleCopyUrl = async () => {
    if (!collection) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${collection.slug}`)
      toast.success('URL copied!')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return FileText
    return File
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/collections')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items • {collection.view_count} views
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/c/${collection.slug}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={() => setAddAssetsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assets
          </Button>
        </div>
      </div>

      {/* Collection Info */}
      {collection.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-muted-foreground">{collection.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => {
            const Icon = getFileIcon(item.asset.mime_type)
            return (
              <Card key={item.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Drag handle */}
                    <div className="cursor-move text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Position */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.custom_title || item.asset.filename}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.asset.filename}
                        {item.custom_title && ` • ${formatBytes(item.asset.size_bytes)}`}
                        {!item.custom_title && ` • ${formatBytes(item.asset.size_bytes)}`}
                      </p>
                    </div>

                    {/* Type badge */}
                    <Badge variant="secondary">
                      {item.asset.mime_type.split('/')[1] || item.asset.mime_type}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(item.asset.public_path, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(item.asset.public_path, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in new tab
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from collection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Add assets to this collection to share them together
            </p>
            <Button onClick={() => setAddAssetsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assets
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateCollectionModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        collection={collection}
        onCollectionSaved={fetchCollection}
      />

      <AddAssetsModal
        open={addAssetsOpen}
        onOpenChange={setAddAssetsOpen}
        collectionId={collectionId}
        existingAssetIds={items.map((i) => i.asset.id)}
        onAssetsAdded={fetchCollection}
      />
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
