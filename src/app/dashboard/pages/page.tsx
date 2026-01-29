'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Calendar,
  FileText,
  Presentation,
  FileSpreadsheet,
  Newspaper,
  MoreHorizontal,
  Trash2,
  Edit,
  Lock,
  Globe,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react'

type ViewMode = 'grid' | 'list'

interface PagelinkDocument {
  id: string
  slug: string
  title: string
  html: string
  document_type: string
  theme: string
  is_public: boolean
  has_password: boolean
  expires_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

const DOCUMENT_TYPE_ICONS: Record<string, typeof FileText> = {
  'pitch_deck': Presentation,
  'investment_memo': FileSpreadsheet,
  'proposal': FileText,
  'one_pager': FileText,
  'case_study': FileText,
  'report': FileSpreadsheet,
  'newsletter': Newspaper,
  'custom': FileText,
}

export default function PagesPage() {
  const [documents, setDocuments] = useState<PagelinkDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/pagelink/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/pagelink/documents/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Pages
            </h1>
            <p className="text-zinc-400 mt-1">Create and manage AI-generated documents</p>
          </div>
          <Link
            href="/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Page
          </Link>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-violet-600/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No pages yet</h3>
            <p className="text-zinc-500 mb-6">
              {searchQuery
                ? 'No pages match your search'
                : 'Create your first AI-generated document'}
            </p>
            {!searchQuery && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Page
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onCopyLink={() => handleCopyLink(doc.slug, doc.id)}
                onDelete={() => handleDelete(doc.id)}
                isCopied={copiedId === doc.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">
                    Views
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">
                    Updated
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onCopyLink={() => handleCopyLink(doc.slug, doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    isCopied={copiedId === doc.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentCard({
  document,
  onCopyLink,
  onDelete,
  isCopied,
}: {
  document: PagelinkDocument
  onCopyLink: () => void
  onDelete: () => void
  isCopied: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const Icon = DOCUMENT_TYPE_ICONS[document.document_type] || FileText

  const isExpired = document.expires_at && new Date(document.expires_at) < new Date()

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors group">
      {/* Preview Area */}
      <Link href={`/d/${document.slug}`}>
        <div className="aspect-[16/10] bg-zinc-950 relative overflow-hidden">
          <div className="absolute inset-0 p-4 scale-[0.3] origin-top-left w-[333%] h-[333%]">
            <div
              dangerouslySetInnerHTML={{ __html: document.html.slice(0, 500) }}
              className="text-white pointer-events-none"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/d/${document.slug}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate hover:text-blue-400 transition-colors">
              {document.title}
            </h3>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-zinc-500" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 w-40 z-20">
                  <Link
                    href={`/d/${document.slug}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={onCopyLink}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                  <a
                    href={`/${document.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                  <hr className="my-1 border-zinc-700" />
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Icon className="w-3.5 h-3.5" />
            {formatDocumentType(document.document_type)}
          </span>
          <span className="flex items-center gap-1">
            {document.is_public ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Private
              </>
            )}
          </span>
          {document.has_password && (
            <span className="flex items-center gap-1 text-amber-500">
              <Shield className="w-3.5 h-3.5" />
              Protected
            </span>
          )}
          {isExpired && (
            <span className="flex items-center gap-1 text-red-400">
              <Clock className="w-3.5 h-3.5" />
              Expired
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {document.view_count}
          </span>
        </div>

        {isCopied && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
            <Check className="w-3.5 h-3.5" />
            Link copied!
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentRow({
  document,
  onCopyLink,
  onDelete,
  isCopied,
}: {
  document: PagelinkDocument
  onCopyLink: () => void
  onDelete: () => void
  isCopied: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const Icon = DOCUMENT_TYPE_ICONS[document.document_type] || FileText

  const isExpired = document.expires_at && new Date(document.expires_at) < new Date()

  return (
    <tr className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
      <td className="px-4 py-3">
        <Link
          href={`/d/${document.slug}`}
          className="font-medium hover:text-blue-400 transition-colors"
        >
          {document.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm text-zinc-400">
          <Icon className="w-4 h-4" />
          {formatDocumentType(document.document_type)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              document.is_public
                ? 'bg-green-500/10 text-green-400'
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {document.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {document.is_public ? 'Public' : 'Private'}
          </span>
          {document.has_password && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
              <Shield className="w-3 h-3" />
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400">
              <Clock className="w-3 h-3" />
              Expired
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-sm text-zinc-400">
          <Eye className="w-4 h-4" />
          {document.view_count}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-sm text-zinc-400">
          <Calendar className="w-4 h-4" />
          {formatDate(document.updated_at)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="relative flex items-center gap-1">
          {isCopied ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check className="w-3.5 h-3.5" />
              Copied
            </span>
          ) : (
            <>
              <button
                onClick={onCopyLink}
                className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4 text-zinc-500" />
              </button>
              <a
                href={`/${document.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </a>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 w-32 z-20">
                      <Link
                        href={`/d/${document.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button
                        onClick={onDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function formatDocumentType(type: string | null): string {
  if (!type) return 'Custom'
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
