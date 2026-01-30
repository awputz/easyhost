'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Clock,
  FileText,
  Plus,
  Trash2,
  Archive,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Document {
  id: string
  slug: string
  title: string
  document_type: string
  theme: string
  is_public: boolean
  view_count: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/pagelink/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Pages</h1>
          <Link
            href="/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New page
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-100 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pages List */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link href={`/d/${doc.slug}`} className="block">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {doc.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(doc.updated_at)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.is_public
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {doc.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyLink(doc.slug)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <a
                    href={`/p/${doc.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Open page"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/d/${doc.slug}`} className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(doc.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
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
        {!loading && documents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No pages yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first page to start sharing content with a simple link.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first page
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              No pages match "{search}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
