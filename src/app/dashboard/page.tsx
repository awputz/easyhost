'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FolderPlus, Link2, LayoutGrid, List, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UploadModal } from '@/components/upload/upload-modal'
import { AssetGrid } from '@/components/assets/asset-grid'
import { AssetList } from '@/components/assets/asset-list'
import { AssetPreview } from '@/components/assets/asset-preview'
import { BulkActionsBar } from '@/components/assets/bulk-actions-bar'
import { FolderBreadcrumb } from '@/components/folders/folder-breadcrumb'
import { CreateFolderModal } from '@/components/folders/create-folder-modal'
import { CreateLinkModal } from '@/components/links/create-link-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Asset } from '@/types'

interface Folder {
  id: string
  name: string
  path: string
  parent_id: string | null
}

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [createLinkAsset, setCreateLinkAsset] = useState<Asset | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolderId) {
        params.set('folder_id', currentFolderId)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      const response = await fetch(`/api/assets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, searchQuery])

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const handleUploadComplete = () => {
    fetchAssets()
  }

  const handleFolderCreated = () => {
    fetchFolders()
  }

  // Build breadcrumb path
  const buildBreadcrumbs = () => {
    if (!currentFolderId) return []

    const breadcrumbs: { id: string | null; name: string }[] = []
    let folder = folders.find((f) => f.id === currentFolderId)

    while (folder) {
      breadcrumbs.unshift({ id: folder.id, name: folder.name })
      folder = folder.parent_id ? folders.find((f) => f.id === folder!.parent_id) : undefined
    }

    return breadcrumbs
  }

  const handleSelectAsset = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(assets.map((a) => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDelete = async () => {
    toast.info(`Deleting ${selectedIds.size} assets...`)
    setSelectedIds(new Set())
    fetchAssets()
  }

  const handleBulkMove = () => {
    toast.info('Move functionality coming soon')
  }

  const handleBulkTag = () => {
    toast.info('Tag functionality coming soon')
  }

  const handleBulkDownload = () => {
    toast.info('Download functionality coming soon')
  }

  const handleDeleteAsset = async (asset: Asset) => {
    toast.success(`Deleted ${asset.filename}`)
    fetchAssets()
  }

  const filteredAssets = assets.filter((asset) =>
    asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const hasAssets = filteredAssets.length > 0
  const breadcrumbs = buildBreadcrumbs()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <FolderBreadcrumb
            items={breadcrumbs}
            onNavigate={setCurrentFolderId}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New folder
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {(assets.length > 0 || searchQuery) && (
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : hasAssets ? (
        viewMode === 'grid' ? (
          <AssetGrid assets={filteredAssets} onAssetsChange={fetchAssets} />
        ) : (
          <AssetList
            assets={filteredAssets}
            selectedIds={selectedIds}
            onSelect={handleSelectAsset}
            onSelectAll={handleSelectAll}
            onPreview={setPreviewAsset}
            onDelete={handleDeleteAsset}
            onCreateLink={setCreateLinkAsset}
          />
        )
      ) : searchQuery ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              No assets match &quot;{searchQuery}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Get started by uploading your first file. Drag and drop files here, or click the button below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload files
              </Button>
              <Button variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                Import from URL
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Supports images, videos, documents, and more. Max 10MB per file on free plan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onTag={handleBulkTag}
        onDownload={handleBulkDownload}
      />

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
      />

      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
        onFolderCreated={handleFolderCreated}
      />

      <AssetPreview
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        assets={filteredAssets}
        onNavigate={setPreviewAsset}
      />

      <CreateLinkModal
        open={!!createLinkAsset}
        onOpenChange={(open) => !open && setCreateLinkAsset(null)}
        asset={createLinkAsset}
      />
    </div>
  )
}
