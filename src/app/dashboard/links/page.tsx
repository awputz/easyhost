'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Link2,
  Plus,
  ExternalLink,
  Copy,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { LinkCard } from '@/components/links/link-card'
import { QRCodeModal } from '@/components/links/qr-code-modal'
import { EditLinkModal } from '@/components/links/edit-link-modal'
import type { ShortLink } from '@/types'

type LinkWithDetails = ShortLink & {
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

export default function LinksPage() {
  const [links, setLinks] = useState<LinkWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all')
  const [qrLink, setQrLink] = useState<ShortLink | null>(null)
  const [editLink, setEditLink] = useState<ShortLink | null>(null)

  const fetchLinks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const response = await fetch(`/api/links?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLinks(data.links || [])
      }
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const handleDelete = async (link: ShortLink) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Link deleted')
        fetchLinks()
      }
    } catch {
      toast.error('Failed to delete link')
    }
  }

  const handleToggleActive = async (link: ShortLink, active: boolean) => {
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      })
      if (response.ok) {
        toast.success(active ? 'Link enabled' : 'Link disabled')
        fetchLinks()
      }
    } catch {
      toast.error('Failed to update link')
    }
  }

  const handleLinkUpdated = () => {
    fetchLinks()
  }

  const filteredLinks = links.filter((link) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      link.slug.toLowerCase().includes(query) ||
      link.asset?.filename.toLowerCase().includes(query) ||
      link.collection?.name.toLowerCase().includes(query)
    )
  })

  const activeCount = links.filter((l) => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())).length
  const expiredCount = links.filter((l) => l.expires_at && new Date(l.expires_at) < new Date()).length
  const disabledCount = links.filter((l) => !l.is_active).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-muted-foreground">
            Manage your short links and track their performance
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{links.length}</div>
            <p className="text-sm text-muted-foreground">Total links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{expiredCount}</div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">{disabledCount}</div>
            <p className="text-sm text-muted-foreground">Disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="disabled">Disabled</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={statusFilter} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLinks.length > 0 ? (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onEdit={setEditLink}
                  onDelete={handleDelete}
                  onQRCode={setQrLink}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  No links match &quot;{searchQuery}&quot;
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Link2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No links yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create short links from your assets to share them easily. Short links can have password protection, expiration dates, and view limits.
                </p>
                <p className="text-sm text-muted-foreground">
                  Go to Assets and click &quot;Create Link&quot; on any file to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <QRCodeModal
        open={!!qrLink}
        onOpenChange={(open) => !open && setQrLink(null)}
        link={qrLink}
      />

      <EditLinkModal
        open={!!editLink}
        onOpenChange={(open) => !open && setEditLink(null)}
        link={editLink}
        onLinkUpdated={handleLinkUpdated}
      />
    </div>
  )
}
