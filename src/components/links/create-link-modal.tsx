'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Link2, Lock, Calendar, Eye, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Asset, ShortLink } from '@/types'

interface CreateLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  onLinkCreated?: (link: ShortLink) => void
}

export function CreateLinkModal({
  open,
  onOpenChange,
  asset,
  onLinkCreated,
}: CreateLinkModalProps) {
  const [loading, setLoading] = useState(false)
  const [customSlug, setCustomSlug] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugCheckLoading, setSlugCheckLoading] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [useExpiration, setUseExpiration] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [useMaxViews, setUseMaxViews] = useState(false)
  const [maxViews, setMaxViews] = useState('100')
  const [createdLink, setCreatedLink] = useState<ShortLink | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCustomSlug('')
      setSlugAvailable(null)
      setUsePassword(false)
      setPassword('')
      setUseExpiration(false)
      setExpiresAt('')
      setUseMaxViews(false)
      setMaxViews('100')
      setCreatedLink(null)
    }
  }, [open])

  // Check slug availability with debounce
  useEffect(() => {
    if (!customSlug) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setSlugCheckLoading(true)
      try {
        const response = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(customSlug)}`)
        const data = await response.json()
        setSlugAvailable(data.available)
      } catch {
        setSlugAvailable(null)
      } finally {
        setSlugCheckLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [customSlug])

  const handleCreate = async () => {
    if (!asset) return

    setLoading(true)
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          custom_slug: customSlug || undefined,
          password: usePassword ? password : undefined,
          expires_at: useExpiration ? new Date(expiresAt).toISOString() : undefined,
          max_views: useMaxViews ? parseInt(maxViews) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create link')
      }

      const { link } = await response.json()
      setCreatedLink(link)
      toast.success('Short link created!')
      onLinkCreated?.(link)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!createdLink) return
    const url = `${window.location.origin}/e/${createdLink.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const shortUrl = createdLink ? `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${createdLink.slug}` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {createdLink ? 'Link Created!' : 'Create Short Link'}
          </DialogTitle>
          <DialogDescription>
            {createdLink
              ? 'Your short link is ready to share'
              : `Create a shareable link for "${asset?.filename}"`}
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={shortUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} size="sm">
                Copy
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              {createdLink.password_hash && (
                <p className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password protected
                </p>
              )}
              {createdLink.expires_at && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expires {new Date(createdLink.expires_at).toLocaleDateString()}
                </p>
              )}
              {createdLink.max_views && (
                <p className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Max {createdLink.max_views} views
                </p>
              )}
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Custom slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Custom URL (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  /e/
                </span>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="auto-generated"
                    className="pr-8"
                  />
                  {customSlug && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {slugCheckLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : slugAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : slugAvailable === false ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for an auto-generated short code
              </p>
            </div>

            {/* Password protection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-password">Password protection</Label>
                </div>
                <Switch
                  id="use-password"
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                />
              </div>
              {usePassword && (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-expiration">Set expiration</Label>
                </div>
                <Switch
                  id="use-expiration"
                  checked={useExpiration}
                  onCheckedChange={setUseExpiration}
                />
              </div>
              {useExpiration && (
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>

            {/* Max views */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-max-views">Limit views</Label>
                </div>
                <Switch
                  id="use-max-views"
                  checked={useMaxViews}
                  onCheckedChange={setUseMaxViews}
                />
              </div>
              {useMaxViews && (
                <Input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  min="1"
                  placeholder="Maximum number of views"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || (customSlug !== '' && slugAvailable === false)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
