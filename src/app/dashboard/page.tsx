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
import {
  Building2,
  FileText,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Eye,
  Clock,
  Search,
  Plus,
} from 'lucide-react'

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

const DOCUMENT_TYPE_INFO: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  offering_memorandum: { label: 'OM', icon: Building2, color: 'text-blue' },
  tear_sheet: { label: 'TS', icon: FileText, color: 'text-emerald-500' },
  leasing_flyer: { label: 'LF', icon: TrendingUp, color: 'text-amber-500' },
  one_pager: { label: '1P', icon: FileText, color: 'text-violet-500' },
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
    toast.success('Link copied to clipboard')
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
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Hero CTA - Only show when no documents */}
        {!loading && documents.length === 0 && (
          <div className="mb-10 p-8 bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold">AI Document Builder</h2>
                  <p className="text-navy-300 text-sm">Create professional CRE marketing materials</p>
                </div>
              </div>

              <p className="text-navy-200 mb-6 max-w-xl">
                Generate investment memos, tear sheets, and leasing flyers with AI. Just describe what you need and get institutional-quality documents in minutes.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue hover:bg-blue-hover text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue/25"
                >
                  <Plus className="w-4 h-4" />
                  Create Document
                </Link>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Try a sample
                </Link>
              </div>

              {/* Feature pills */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-navy-200">
                  NYC Property Data
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-navy-200">
                  6 Premium Themes
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-navy-200">
                  Export HTML
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">Documents</h1>
            {documents.length > 0 && (
              <p className="text-navy-500 text-sm mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        {/* Search */}
        {documents.length > 0 && (
          <div className="mb-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-200 transition-all"
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-xl border border-navy-100 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-navy-100 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 bg-navy-100 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-navy-50 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents List */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => {
              const docType = DOCUMENT_TYPE_INFO[doc.document_type] || DOCUMENT_TYPE_INFO.one_pager
              const DocIcon = docType.icon

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-navy-100 hover:border-navy-200 hover:shadow-sm transition-all group"
                >
                  {/* Content */}
                  <Link href={`/d/${doc.slug}`} className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0 ${docType.color}`}>
                      <DocIcon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-navy-900 group-hover:text-navy-700 transition-colors truncate">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-navy-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {doc.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(doc.updated_at)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            doc.is_public ? 'text-emerald-600' : 'text-navy-400'
                          }`}
                        >
                          {doc.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyLink(doc.slug)}
                      className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={`/p/${doc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                      title="Open"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
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
              )
            })}
          </div>
        )}

        {/* Empty state - When has documents but no search results */}
        {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-navy-100 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-navy-400" />
            </div>
            <h3 className="font-display text-xl text-navy-900 mb-2">
              No results
            </h3>
            <p className="text-navy-500">
              No documents match &quot;{search}&quot;
            </p>
          </div>
        )}

        {/* Compact CTA when has documents */}
        {!loading && documents.length > 0 && (
          <div className="mt-8 p-6 bg-navy-50 rounded-xl border border-navy-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <h3 className="font-medium text-navy-900">Create with AI</h3>
                  <p className="text-sm text-navy-500">Generate professional CRE documents in minutes</p>
                </div>
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Document
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
