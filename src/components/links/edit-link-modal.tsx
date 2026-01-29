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
import type { ShortLink } from '@/types'

interface EditLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: ShortLink | null
  onLinkUpdated?: (link: ShortLink) => void
}

export function EditLinkModal({
  open,
  onOpenChange,
  link,
  onLinkUpdated,
}: EditLinkModalProps) {
  const [loading, setLoading] = useState(false)
  const [customSlug, setCustomSlug] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugCheckLoading, setSlugCheckLoading] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [removePassword, setRemovePassword] = useState(false)
  const [useExpiration, setUseExpiration] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [useMaxViews, setUseMaxViews] = useState(false)
  const [maxViews, setMaxViews] = useState('100')

  // Initialize form when modal opens
  useEffect(() => {
    if (open && link) {
      setCustomSlug(link.slug)
      setSlugAvailable(true)
      setUsePassword(false)
      setPassword('')
      setRemovePassword(false)
      setUseExpiration(!!link.expires_at)
      setExpiresAt(link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '')
      setUseMaxViews(!!link.max_views)
      setMaxViews(link.max_views?.toString() || '100')
    }
  }, [open, link])

  // Check slug availability with debounce
  useEffect(() => {
    if (!customSlug || customSlug === link?.slug) {
      setSlugAvailable(customSlug === link?.slug ? true : null)
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
  }, [customSlug, link?.slug])

  const handleSave = async () => {
    if (!link) return

    setLoading(true)
    try {
      const updates: Record<string, unknown> = {}

      if (customSlug !== link.slug) {
        updates.custom_slug = customSlug
      }

      if (usePassword && password) {
        updates.password = password
      }

      if (removePassword) {
        updates.remove_password = true
      }

      if (useExpiration && expiresAt) {
        updates.expires_at = new Date(expiresAt).toISOString()
      } else if (!useExpiration && link.expires_at) {
        updates.expires_at = null
      }

      if (useMaxViews && maxViews) {
        updates.max_views = parseInt(maxViews)
      } else if (!useMaxViews && link.max_views) {
        updates.max_views = null
      }

      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update link')
      }

      const { link: updatedLink } = await response.json()
      toast.success('Link updated!')
      onLinkUpdated?.(updatedLink)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Edit Link Settings
          </DialogTitle>
          <DialogDescription>
            Update the settings for this short link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Custom slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Custom URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /e/
              </span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="pr-8"
                />
                {customSlug && customSlug !== link?.slug && (
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
          </div>

          {/* Password protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="use-password">
                  {link?.password_hash ? 'Change password' : 'Add password protection'}
                </Label>
              </div>
              <Switch
                id="use-password"
                checked={usePassword}
                onCheckedChange={(checked) => {
                  setUsePassword(checked)
                  if (!checked) setPassword('')
                }}
              />
            </div>
            {usePassword && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            )}
            {link?.password_hash && !usePassword && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Password protected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemovePassword(!removePassword)}
                  className={removePassword ? 'text-destructive' : ''}
                >
                  {removePassword ? 'Undo' : 'Remove password'}
                </Button>
              </div>
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
              onClick={handleSave}
              disabled={loading || (customSlug !== link?.slug && slugAvailable === false)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
