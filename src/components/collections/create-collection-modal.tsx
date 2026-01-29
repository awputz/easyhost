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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FolderKanban, LayoutGrid, List, Presentation } from 'lucide-react'
import { toast } from 'sonner'
import type { Collection, CollectionLayout } from '@/types'

interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection?: Collection | null
  onCollectionSaved: () => void
}

export function CreateCollectionModal({
  open,
  onOpenChange,
  collection,
  onCollectionSaved,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [layout, setLayout] = useState<CollectionLayout>('grid')
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6')
  const [headerText, setHeaderText] = useState('')
  const [footerText, setFooterText] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!collection

  // Initialize form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || '')
      setSlug(collection.slug)
      setIsPublic(collection.is_public)
      setLayout(collection.layout)
      setPrimaryColor(collection.branding?.primary_color || '#8b5cf6')
      setHeaderText(collection.branding?.header_text || '')
      setFooterText(collection.branding?.footer_text || '')
    } else {
      // Reset form for new collection
      setName('')
      setDescription('')
      setSlug('')
      setIsPublic(false)
      setLayout('grid')
      setPrimaryColor('#8b5cf6')
      setHeaderText('')
      setFooterText('')
    }
  }, [collection, open])

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && name) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }, [name, isEditing])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        slug: slug.trim(),
        is_public: isPublic,
        layout,
        branding: {
          primary_color: primaryColor,
          header_text: headerText.trim() || undefined,
          footer_text: footerText.trim() || undefined,
        },
      }

      const url = isEditing
        ? `/api/collections/${collection.id}`
        : '/api/collections'

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save collection')
      }

      toast.success(isEditing ? 'Collection updated!' : 'Collection created!')
      onCollectionSaved()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            {isEditing ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your collection settings'
              : 'Create a new collection to group and share assets'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Launch Assets"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="All assets for the Q1 product launch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/c/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="product-launch"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="space-y-2">
            <Label>Layout</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={layout === 'grid' ? 'default' : 'outline'}
                onClick={() => setLayout('grid')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs">Grid</span>
              </Button>
              <Button
                type="button"
                variant={layout === 'list' ? 'default' : 'outline'}
                onClick={() => setLayout('list')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <List className="h-5 w-5" />
                <span className="text-xs">List</span>
              </Button>
              <Button
                type="button"
                variant={layout === 'presentation' ? 'default' : 'outline'}
                onClick={() => setLayout('presentation')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Presentation className="h-5 w-5" />
                <span className="text-xs">Slides</span>
              </Button>
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4">
            <Label className="text-base">Branding</Label>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerText">Header Text</Label>
              <Input
                id="headerText"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Welcome to our collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2024 Company Name"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Collection</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Collection'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
