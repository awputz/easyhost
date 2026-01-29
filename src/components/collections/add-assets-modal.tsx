'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Loader2,
  FileImage,
  FileVideo,
  FileText,
  File,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface AddAssetsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  existingAssetIds: string[]
  onAssetsAdded: () => void
}

export function AddAssetsModal({
  open,
  onOpenChange,
  collectionId,
  existingAssetIds,
  onAssetsAdded,
}: AddAssetsModalProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        // Filter out assets already in the collection
        const availableAssets = (data.assets || []).filter(
          (a: Asset) => !existingAssetIds.includes(a.id)
        )
        setAssets(availableAssets)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }, [existingAssetIds])

  useEffect(() => {
    if (open) {
      fetchAssets()
      setSelectedIds(new Set())
      setSearchQuery('')
    }
  }, [open, fetchAssets])

  const toggleAsset = (assetId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(assetId)) {
        next.delete(assetId)
      } else {
        next.add(assetId)
      }
      return next
    })
  }

  const handleAdd = async () => {
    if (selectedIds.size === 0) return

    setAdding(true)
    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_ids: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add assets')
      }

      toast.success(`Added ${selectedIds.size} asset${selectedIds.size > 1 ? 's' : ''} to collection`)
      onAssetsAdded()
      onOpenChange(false)
    } catch {
      toast.error('Failed to add assets')
    } finally {
      setAdding(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return FileText
    return File
  }

  const filteredAssets = assets.filter((asset) =>
    asset.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Assets
          </DialogTitle>
          <DialogDescription>
            Select assets to add to this collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Asset list */}
          <ScrollArea className="h-[400px] border rounded-lg">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAssets.length > 0 ? (
              <div className="p-2">
                {filteredAssets.map((asset) => {
                  const Icon = getFileIcon(asset.mime_type)
                  const isSelected = selectedIds.has(asset.id)

                  return (
                    <label
                      key={asset.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAsset(asset.id)}
                      />
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.mime_type.split('/')[1]} • {formatBytes(asset.size_bytes)}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No assets match your search</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <File className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No assets available to add</p>
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} asset{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={adding || selectedIds.size === 0}
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Collection
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
