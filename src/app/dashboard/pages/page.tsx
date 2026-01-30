'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  archived_at: string | null
}

export default function PagesPage() {
  const [documents, setDocuments] = useState<PagelinkDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [showArchived])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showArchived) params.set('archived', 'true')
      const response = await fetch(`/api/pagelink/documents?${params.toString()}`)
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
    if (!confirm('Are you sure you want to permanently delete this document?')) return

    try {
      const response = await fetch(`/api/pagelink/documents/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/pagelink/documents/${id}/archive`, {
        method: 'POST',
      })
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Error archiving document:', error)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/pagelink/documents/${id}/archive`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Error restoring document:', error)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/pagelink/documents/${id}/duplicate`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error duplicating document:', error)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDocumentType = (type: string | null): string => {
    if (!type) return 'Custom'
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-5xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy-900">AI Pages</h1>
            <p className="text-navy-500 text-sm mt-1">Create and manage AI-generated documents</p>
          </div>
          <Link
            href="/create"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          >
            + Create Page
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-navy-100">
          <button
            onClick={() => setShowArchived(false)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              !showArchived
                ? 'text-navy-900 border-navy-800'
                : 'text-navy-400 border-transparent hover:text-navy-600'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              showArchived
                ? 'text-navy-900 border-navy-800'
                : 'text-navy-400 border-transparent hover:text-navy-600'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full bg-white border border-navy-100 rounded-lg pl-4 pr-4 py-2 text-sm text-navy-800 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-200"
            />
          </div>
          <div className="flex bg-white border border-navy-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-sm ${
                viewMode === 'grid' ? 'bg-navy-100 text-navy-900' : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm ${
                viewMode === 'list' ? 'bg-navy-100 text-navy-900' : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-navy-100">
                <div className="h-4 bg-navy-100 rounded w-3/4 mb-4" />
                <div className="h-3 bg-navy-50 rounded w-1/2 mb-2" />
                <div className="h-3 bg-navy-50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-navy-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{showArchived ? '📦' : '✨'}</span>
            </div>
            <h3 className="font-serif text-lg font-medium text-navy-900 mb-2">
              {showArchived ? 'No archived pages' : 'No pages yet'}
            </h3>
            <p className="text-navy-500 mb-6">
              {searchQuery
                ? 'No pages match your search'
                : showArchived
                  ? 'Documents you archive will appear here'
                  : 'Create your first AI-generated document'}
            </p>
            {!searchQuery && !showArchived && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
              >
                + Create Page
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
                onArchive={() => handleArchive(doc.id)}
                onRestore={() => handleRestore(doc.id)}
                onDuplicate={() => handleDuplicate(doc.id)}
                isCopied={copiedId === doc.id}
                isArchived={showArchived}
                formatDate={formatDate}
                formatDocumentType={formatDocumentType}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 uppercase">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 uppercase">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 uppercase">
                    Views
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 uppercase">
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
                    onArchive={() => handleArchive(doc.id)}
                    onRestore={() => handleRestore(doc.id)}
                    onDuplicate={() => handleDuplicate(doc.id)}
                    isCopied={copiedId === doc.id}
                    isArchived={showArchived}
                    formatDate={formatDate}
                    formatDocumentType={formatDocumentType}
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
  onArchive,
  onRestore,
  onDuplicate,
  isCopied,
  isArchived,
  formatDate,
  formatDocumentType,
}: {
  document: PagelinkDocument
  onCopyLink: () => void
  onDelete: () => void
  onArchive: () => void
  onRestore: () => void
  onDuplicate: () => void
  isCopied: boolean
  isArchived: boolean
  formatDate: (date: string) => string
  formatDocumentType: (type: string | null) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isExpired = document.expires_at && new Date(document.expires_at) < new Date()

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden hover:border-navy-200 hover:shadow-sm transition-all group">
      {/* Preview Area */}
      <Link href={`/d/${document.slug}`}>
        <div className="aspect-[16/10] bg-cream-100 relative overflow-hidden">
          <div className="absolute inset-0 p-4 scale-[0.3] origin-top-left w-[333%] h-[333%]">
            <div
              dangerouslySetInnerHTML={{ __html: document.html?.slice(0, 500) || '' }}
              className="text-navy-900 pointer-events-none"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          {isArchived && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-navy-100 rounded text-xs text-navy-600">
              Archived
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/d/${document.slug}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-navy-900 truncate hover:text-navy-700 transition-colors">
              {document.title}
            </h3>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-navy-50 rounded transition-colors text-navy-400"
            >
              •••
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-navy-100 py-1 w-40 z-20">
                  <Link
                    href={`/d/${document.slug}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => { onCopyLink(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    Copy Link
                  </button>
                  <a
                    href={`/${document.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    Open
                  </a>
                  {!isArchived && (
                    <button
                      onClick={() => { onDuplicate(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                    >
                      Duplicate
                    </button>
                  )}
                  <hr className="my-1 border-navy-100" />
                  {isArchived ? (
                    <>
                      <button
                        onClick={() => { onRestore(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-navy-50 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-navy-50 transition-colors"
                      >
                        Delete Forever
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { onArchive(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-navy-50 transition-colors"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-navy-500">
          <span>{formatDocumentType(document.document_type)}</span>
          <span>{document.is_public ? 'Public' : 'Private'}</span>
          {document.has_password && <span className="text-amber-600">Protected</span>}
          {isExpired && <span className="text-red-600">Expired</span>}
          <span>{document.view_count} views</span>
        </div>

        {isCopied && (
          <div className="mt-2 text-xs text-green-600">
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
  onArchive,
  onRestore,
  onDuplicate,
  isCopied,
  isArchived,
  formatDate,
  formatDocumentType,
}: {
  document: PagelinkDocument
  onCopyLink: () => void
  onDelete: () => void
  onArchive: () => void
  onRestore: () => void
  onDuplicate: () => void
  isCopied: boolean
  isArchived: boolean
  formatDate: (date: string) => string
  formatDocumentType: (type: string | null) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isExpired = document.expires_at && new Date(document.expires_at) < new Date()

  return (
    <tr className="border-b border-navy-100 last:border-0 hover:bg-cream-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/d/${document.slug}`}
            className="font-medium text-navy-900 hover:text-navy-700 transition-colors"
          >
            {document.title}
          </Link>
          {isArchived && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-navy-100 text-navy-600">
              Archived
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-navy-600">
          {formatDocumentType(document.document_type)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              document.is_public
                ? 'bg-green-100 text-green-700'
                : 'bg-navy-100 text-navy-600'
            }`}
          >
            {document.is_public ? 'Public' : 'Private'}
          </span>
          {document.has_password && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
              Protected
            </span>
          )}
          {isExpired && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
              Expired
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-navy-600">
          {document.view_count}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-navy-500">
          {formatDate(document.updated_at)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="relative flex items-center gap-1">
          {isCopied ? (
            <span className="text-xs text-green-600">
              Copied
            </span>
          ) : (
            <>
              <button
                onClick={onCopyLink}
                className="p-1.5 hover:bg-navy-100 rounded transition-colors text-navy-500"
                title="Copy link"
              >
                ⎘
              </button>
              <a
                href={`/${document.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-navy-100 rounded transition-colors text-navy-500"
                title="Open in new tab"
              >
                ↗
              </a>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-navy-100 rounded transition-colors text-navy-500"
                >
                  •••
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-navy-100 py-1 w-40 z-20">
                      <Link
                        href={`/d/${document.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                      >
                        Edit
                      </Link>
                      {!isArchived && (
                        <button
                          onClick={() => { onDuplicate(); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                        >
                          Duplicate
                        </button>
                      )}
                      <hr className="my-1 border-navy-100" />
                      {isArchived ? (
                        <>
                          <button
                            onClick={() => { onRestore(); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-navy-50 transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => { onDelete(); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-navy-50 transition-colors"
                          >
                            Delete Forever
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { onArchive(); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-navy-50 transition-colors"
                        >
                          Archive
                        </button>
                      )}
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
