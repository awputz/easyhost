'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Upload,
  FolderOpen,
  Image,
  FileText,
  Film,
  File,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2,
  Download,
  Plus,
  LayoutGrid,
  List,
} from 'lucide-react'
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

  const getIcon = (type: string) => {
    if (type?.startsWith('image/')) return Image
    if (type?.startsWith('video/')) return Film
    if (type === 'application/pdf') return FileText
    return File
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
    toast.success('Link copied!')
  }

  const filteredAssets = assets.filter((asset) =>
    asset.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <Link
            href="/new/upload"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Link>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border border-gray-100 animate-pulse ${
                  viewMode === 'grid' ? 'p-4' : 'flex items-center gap-4 p-4'
                }`}
              >
                <div
                  className={`bg-gray-100 rounded-lg ${
                    viewMode === 'grid' ? 'aspect-square mb-3' : 'w-12 h-12'
                  }`}
                />
                <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredAssets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => {
              const Icon = getIcon(asset.file_type)
              const isImage = asset.file_type?.startsWith('image/')

              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group"
                >
                  {/* Preview */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                    {isImage && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-gray-400" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyLink(asset.url)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {asset.filename}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
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
            {filteredAssets.map((asset) => {
              const Icon = getIcon(asset.file_type)

              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {asset.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatSize(asset.file_size)} · {formatDate(asset.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyLink(asset.url)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(asset.url)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && assets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No files yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload images, PDFs, videos, or any files you want to share.
            </p>
            <Link
              href="/new/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload your first file
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && assets.length > 0 && filteredAssets.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">No files match "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
