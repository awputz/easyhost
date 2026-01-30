'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  Star,
  ThumbsUp,
  Check,
  X,
  Trash2,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Feedback {
  id: string
  type: 'comment' | 'reaction' | 'rating'
  content: string | null
  reaction: string | null
  rating: number | null
  email: string | null
  name: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  ip_address: string | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocument()
  }, [slug])

  useEffect(() => {
    if (documentId) {
      fetchFeedback()
    }
  }, [documentId, pagination.page, statusFilter])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/pagelink/documents/by-slug/${slug}`)
      if (response.ok) {
        const doc = await response.json()
        setDocumentId(doc.id)
        setDocumentTitle(doc.title)
      } else {
        router.push('/dashboard/pages')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      router.push('/dashboard/pages')
    }
  }

  const fetchFeedback = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/pagelink/documents/${documentId}/feedback?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (feedbackId: string, status: 'approved' | 'rejected') => {
    if (!documentId) return

    setUpdatingId(feedbackId)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status }),
      })
      if (response.ok) {
        setFeedback(prev => prev.map(f =>
          f.id === feedbackId ? { ...f, status } : f
        ))
      }
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteFeedback = async (feedbackId: string) => {
    if (!documentId) return
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setDeletingId(feedbackId)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/feedback?feedbackId=${feedbackId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFeedback(prev => prev.filter(f => f.id !== feedbackId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'pending':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
  }

  const pendingCount = feedback.filter(f => f.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/d/${slug}`}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h1 className="text-xl font-semibold text-white">Feedback</h1>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500">{documentTitle}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">All Feedback</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-white">{pagination.total}</div>
            <div className="text-sm text-zinc-500">Total Feedback</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-amber-400">
              {feedback.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-sm text-zinc-500">Pending</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-green-400">
              {feedback.filter(f => f.status === 'approved').length}
            </div>
            <div className="text-sm text-zinc-500">Approved</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-white">
              {feedback.filter(f => f.rating).length > 0
                ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
                : '—'}
            </div>
            <div className="text-sm text-zinc-500">Avg Rating</div>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No feedback yet</h3>
            <p className="text-zinc-500">
              {statusFilter !== 'all'
                ? 'No feedback matches this filter.'
                : 'Enable feedback collection to start receiving comments.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.rating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-zinc-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {item.reaction && (
                        <span className="text-xl">{item.reaction}</span>
                      )}
                    </div>

                    {/* Content */}
                    {item.content && (
                      <p className="text-white mb-3">{item.content}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      {item.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </div>
                      )}
                      {item.name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          disabled={updatingId === item.id}
                          className="p-2 hover:bg-green-500/10 text-zinc-400 hover:text-green-400 rounded-lg transition-colors"
                          title="Approve"
                        >
                          {updatingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'rejected')}
                          disabled={updatingId === item.id}
                          className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-zinc-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="border-zinc-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-zinc-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="border-zinc-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
