'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  FolderKanban,
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  ExternalLink,
  Trash2,
  Settings,
  Lock,
  Globe,
  LayoutGrid,
  List,
  Presentation,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateCollectionModal } from '@/components/collections/create-collection-modal'
import type { Collection, CollectionLayout } from '@/types'

interface CollectionWithCount extends Collection {
  item_count?: number
}

const layoutIcons: Record<CollectionLayout, React.ReactNode> = {
  grid: <LayoutGrid className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
}

export default function CollectionsPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editCollection, setEditCollection] = useState<Collection | null>(null)

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`Are you sure you want to delete "${collection.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Collection deleted')
        fetchCollections()
      }
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  const handleCopyUrl = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`)
      toast.success('URL copied!')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-muted-foreground">
            Group and share assets as branded deal rooms
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Search */}
      {(collections.length > 0 || searchQuery) && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card
              key={collection.id}
              className="group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/dashboard/collections/${collection.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${collection.branding?.primary_color || '#8b5cf6'}20` }}
                    >
                      <FolderKanban
                        className="h-5 w-5"
                        style={{ color: collection.branding?.primary_color || '#8b5cf6' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{collection.name}</CardTitle>
                      <CardDescription className="text-xs truncate">
                        /c/{collection.slug}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/c/${collection.slug}`, '_blank')
                      }}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Public Page
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleCopyUrl(collection.slug)
                      }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setEditCollection(collection)
                      }}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(collection)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1">
                      {layoutIcons[collection.layout]}
                      {collection.layout}
                    </Badge>
                    <span className="text-muted-foreground">
                      {collection.item_count || 0} items
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    {collection.is_public ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <Eye className="h-4 w-4" />
                    <span>{collection.view_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              No collections match &ldquo;{searchQuery}&rdquo;
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Collections let you group assets together and share them as a branded deal room
              or portfolio. Perfect for client presentations!
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateCollectionModal
        open={createOpen || !!editCollection}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditCollection(null)
          }
        }}
        collection={editCollection}
        onCollectionSaved={fetchCollections}
      />
    </div>
  )
}
