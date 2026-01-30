'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Asset {
  id: string
  filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export default function FilesPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets')
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const getFileLabel = (type: string) => {
    if (type?.startsWith('image/')) return 'IMG'
    if (type?.startsWith('video/')) return 'VID'
    if (type === 'application/pdf') return 'PDF'
    if (type === 'text/html') return 'HTML'
    return 'FILE'
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays < 1) return 'Today'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link copied')
  }

  const filteredAssets = assets.filter((asset) =>
    asset.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-5xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Files</h1>
          <Link
            href="/new/upload"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          >
            + Upload
          </Link>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="flex-1 px-4 py-2.5 bg-white border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-200 transition-all"
          />
          <div className="flex bg-white border border-navy-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid'
                  ? 'bg-navy-800 text-cream-50'
                  : 'text-navy-500 hover:bg-navy-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list'
                  ? 'bg-navy-800 text-cream-50'
                  : 'text-navy-500 hover:bg-navy-50'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-2'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`bg-white rounded-lg border border-navy-100 animate-pulse ${
                  viewMode === 'grid' ? 'p-4' : 'flex items-center gap-4 p-4'
                }`}
              >
                <div
                  className={`bg-navy-100 rounded ${
                    viewMode === 'grid' ? 'aspect-square mb-3' : 'w-12 h-12'
                  }`}
                />
                <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                  <div className="h-4 bg-navy-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-navy-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredAssets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => {
              const isImage = asset.file_type?.startsWith('image/')

              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-lg border border-navy-100 overflow-hidden hover:border-navy-200 hover:shadow-sm transition-all group"
                >
                  {/* Preview */}
                  <div className="aspect-square bg-cream-100 flex items-center justify-center relative">
                    {isImage && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">
                        {getFileLabel(asset.file_type)}
                      </span>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyLink(asset.url)}
                        className="px-3 py-1.5 bg-white rounded text-xs text-navy-800 hover:bg-cream-50"
                      >
                        Copy link
                      </button>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white rounded text-xs text-navy-800 hover:bg-cream-50"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-navy-900 truncate text-sm">
                      {asset.filename}
                    </p>
                    <p className="text-xs text-navy-400 mt-1">
                      {formatSize(asset.file_size)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredAssets.length > 0 && (
          <div className="space-y-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-navy-100 hover:border-navy-200 hover:shadow-sm transition-all group"
              >
                <span className="font-mono text-xs text-navy-400 uppercase tracking-wider w-10">
                  {getFileLabel(asset.file_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 truncate text-sm">
                    {asset.filename}
                  </p>
                  <p className="text-xs text-navy-400">
                    {formatSize(asset.file_size)} &middot; {formatDate(asset.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyLink(asset.url)}
                    className="px-3 py-1.5 text-xs text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded transition-colors"
                  >
                    Copy link
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded transition-colors"
                  >
                    Open
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="px-2 py-1.5 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-colors">
                        &middot;&middot;&middot;
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => copyLink(asset.url)} className="text-sm">
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm">
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 text-sm">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && assets.length === 0 && (
          <div className="text-center py-16">
            <h3 className="font-serif text-xl text-navy-900 mb-2">
              No files yet
            </h3>
            <p className="text-navy-500 mb-6 max-w-sm mx-auto">
              Upload images, PDFs, videos, or any files you want to share.
            </p>
            <Link
              href="/new/upload"
              className="inline-block px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
            >
              Upload your first file
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && assets.length > 0 && filteredAssets.length === 0 && (
          <div className="text-center py-16">
            <h3 className="font-serif text-xl text-navy-900 mb-2">
              No results
            </h3>
            <p className="text-navy-500">
              No files match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
