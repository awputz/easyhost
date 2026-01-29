'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileImage,
  FileVideo,
  FileText,
  File,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CollectionAsset {
  id: string
  asset_id: string
  position: number
  custom_title: string | null
  asset: {
    id: string
    filename: string
    mime_type: string
    size_bytes: number
    public_path: string
  }
}

interface Collection {
  id: string
  name: string
  description: string | null
  slug: string
  is_public: boolean
  branding: {
    primary_color?: string
    header_text?: string
    footer_text?: string
    layout?: 'grid' | 'list' | 'presentation'
  } | null
  items: CollectionAsset[]
}

export default function PublicCollectionPage() {
  const params = useParams()
  const slug = params.slug as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    async function fetchCollection() {
      try {
        const response = await fetch(`/api/c/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Collection not found')
          } else {
            setError('Failed to load collection')
          }
          return
        }
        const data = await response.json()
        setCollection(data.collection)
      } catch {
        setError('Failed to load collection')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <File className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{error || 'Collection not found'}</h1>
        <p className="text-muted-foreground">This collection may have been removed or is not public.</p>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    )
  }

  const branding = collection.branding || {}
  const layout = branding.layout || 'grid'
  const primaryColor = branding.primary_color || '#3b82f6'

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.startsWith('video/')) return FileVideo
    if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return FileText
    return File
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isVideo = (mimeType: string) => mimeType.startsWith('video/')

  const renderPresentationView = () => {
    if (collection.items.length === 0) return null

    const currentItem = collection.items[currentSlide]
    const asset = currentItem.asset

    return (
      <div className="flex flex-col h-screen">
        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {isImage(asset.mime_type) ? (
            <Image
              src={asset.public_path}
              alt={currentItem.custom_title || asset.filename}
              fill
              className="object-contain"
              priority
            />
          ) : isVideo(asset.mime_type) ? (
            <video
              src={asset.public_path}
              controls
              className="max-h-full max-w-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white">
              <File className="h-24 w-24" />
              <p className="text-xl">{currentItem.custom_title || asset.filename}</p>
            </div>
          )}

          {/* Navigation arrows */}
          {collection.items.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide(prev => prev > 0 ? prev - 1 : collection.items.length - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => setCurrentSlide(prev => prev < collection.items.length - 1 ? prev + 1 : 0)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="font-medium">{currentItem.custom_title || asset.filename}</h2>
            <p className="text-sm text-gray-400">{currentSlide + 1} of {collection.items.length}</p>
          </div>
          <div className="flex gap-2">
            <a href={asset.public_path} download>
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </a>
            <a href={asset.public_path} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </a>
          </div>
        </div>

        {/* Thumbnail strip */}
        {collection.items.length > 1 && (
          <div className="bg-gray-950 p-2 flex gap-2 overflow-x-auto">
            {collection.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentSlide(index)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                  index === currentSlide ? 'border-white' : 'border-transparent hover:border-gray-500'
                }`}
              >
                {isImage(item.asset.mime_type) ? (
                  <Image
                    src={item.asset.public_path}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    {(() => {
                      const Icon = getFileIcon(item.asset.mime_type)
                      return <Icon className="h-6 w-6 text-gray-400" />
                    })()}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderListView = () => (
    <div className="space-y-2">
      {collection.items.map((item) => {
        const Icon = getFileIcon(item.asset.mime_type)

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              {isImage(item.asset.mime_type) ? (
                <Image
                  src={item.asset.public_path}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Icon className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {item.custom_title || item.asset.filename}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.asset.mime_type.split('/')[1].toUpperCase()} • {formatBytes(item.asset.size_bytes)}
              </p>
            </div>
            <div className="flex gap-2">
              <a href={item.asset.public_path} download>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <a href={item.asset.public_path} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {collection.items.map((item) => {
        const Icon = getFileIcon(item.asset.mime_type)

        return (
          <div
            key={item.id}
            className="group bg-white dark:bg-gray-800 rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
              {isImage(item.asset.mime_type) ? (
                <Image
                  src={item.asset.public_path}
                  alt={item.custom_title || item.asset.filename}
                  fill
                  className="object-cover"
                />
              ) : isVideo(item.asset.mime_type) ? (
                <video
                  src={item.asset.public_path}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a href={item.asset.public_path} download>
                  <Button size="sm" variant="secondary">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <a href={item.asset.public_path} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="p-3">
              <p className="font-medium truncate text-sm">
                {item.custom_title || item.asset.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(item.asset.size_bytes)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Presentation layout is fullscreen
  if (layout === 'presentation') {
    return renderPresentationView()
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="py-8 px-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-6xl mx-auto text-white">
          {branding.header_text && (
            <p className="text-sm opacity-80 mb-2">{branding.header_text}</p>
          )}
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 opacity-90">{collection.description}</p>
          )}
          <p className="mt-4 text-sm opacity-75">
            {collection.items.length} item{collection.items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4 py-8">
        {collection.items.length === 0 ? (
          <div className="text-center py-12">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">This collection is empty.</p>
          </div>
        ) : layout === 'list' ? (
          renderListView()
        ) : (
          renderGridView()
        )}
      </main>

      {/* Footer */}
      {branding.footer_text && (
        <footer className="py-6 px-4 border-t text-center text-muted-foreground text-sm">
          {branding.footer_text}
        </footer>
      )}
    </div>
  )
}
