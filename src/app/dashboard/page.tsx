'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
    toast.success('Link copied')
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
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl font-semibold text-navy-900">Pages</h1>
          <Link
            href="/new"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          >
            + New
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full px-4 py-2.5 bg-white border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-200 transition-all"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-lg border border-navy-100 animate-pulse"
              >
                <div className="h-5 bg-navy-100 rounded w-1/3 mb-2" />
                <div className="h-4 bg-navy-50 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Pages List */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-navy-100 hover:border-navy-200 hover:shadow-sm transition-all group"
              >
                {/* Content */}
                <Link href={`/d/${doc.slug}`} className="flex-1 min-w-0">
                  <h3 className="font-medium text-navy-900 group-hover:text-navy-700 transition-colors truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-navy-400">
                    <span className="font-mono text-xs">{doc.view_count} views</span>
                    <span>{formatDate(doc.updated_at)}</span>
                    <span
                      className={`text-xs ${
                        doc.is_public ? 'text-green-600' : 'text-navy-400'
                      }`}
                    >
                      {doc.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyLink(doc.slug)}
                    className="px-3 py-1.5 text-xs text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded transition-colors"
                  >
                    Copy link
                  </button>
                  <a
                    href={`/p/${doc.slug}`}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/d/${doc.slug}`} className="cursor-pointer text-sm">
                          Edit settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(doc.slug)} className="text-sm">
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-sm">
                        Archive
                      </DropdownMenuItem>
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
        {!loading && documents.length === 0 && (
          <div className="text-center py-16">
            <h3 className="font-serif text-xl text-navy-900 mb-2">
              No pages yet
            </h3>
            <p className="text-navy-500 mb-6 max-w-sm mx-auto">
              Create your first page to start sharing content with a simple link.
            </p>
            <Link
              href="/new"
              className="inline-block px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
            >
              Create your first page
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <h3 className="font-serif text-xl text-navy-900 mb-2">
              No results
            </h3>
            <p className="text-navy-500">
              No pages match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
