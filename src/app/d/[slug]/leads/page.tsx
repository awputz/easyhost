'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Trash2,
  Mail,
  User,
  Building2,
  Phone,
  Calendar,
  Loader2,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  phone: string | null
  custom_fields: Record<string, string> | null
  created_at: string
  ip_address: string | null
  user_agent: string | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function LeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocument()
  }, [slug])

  useEffect(() => {
    if (documentId) {
      fetchLeads()
    }
  }, [documentId, pagination.page, searchQuery])

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

  const fetchLeads = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/pagelink/documents/${documentId}/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!documentId) return

    setIsExporting(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/leads/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${slug}-leads-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!documentId) return
    if (!confirm('Are you sure you want to delete this lead?')) return

    setDeletingId(leadId)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/leads?leadId=${leadId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setLeads(leads.filter(l => l.id !== leadId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLeads()
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
                <Users className="w-5 h-5 text-green-400" />
                <h1 className="text-xl font-semibold text-white">Leads</h1>
              </div>
              <p className="text-sm text-zinc-500">{documentTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || leads.length === 0}
              className="border-zinc-700"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-white">{pagination.total}</div>
            <div className="text-sm text-zinc-500">Total Leads</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-white">
              {leads.filter(l => {
                const date = new Date(l.created_at)
                const now = new Date()
                return date.getDate() === now.getDate() &&
                       date.getMonth() === now.getMonth() &&
                       date.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <div className="text-sm text-zinc-500">Today</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-3xl font-bold text-white">
              {leads.filter(l => {
                const date = new Date(l.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return date > weekAgo
              }).length}
            </div>
            <div className="text-sm text-zinc-500">Last 7 Days</div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, or company..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
            />
          </div>
        </form>

        {/* Leads Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No leads yet</h3>
            <p className="text-zinc-500">
              {searchQuery
                ? 'No leads match your search.'
                : 'Enable lead capture to start collecting leads.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-zinc-800/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-zinc-500" />
                                <span className="text-white">{lead.email}</span>
                              </div>
                              {lead.name && (
                                <div className="text-sm text-zinc-500">{lead.name}</div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {lead.company ? (
                            <div className="flex items-center gap-2 text-zinc-300">
                              <Building2 className="w-4 h-4 text-zinc-500" />
                              {lead.company}
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(lead.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={deletingId === lead.id}
                            className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                          >
                            {deletingId === lead.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-zinc-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} leads
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
          </>
        )}
      </main>
    </div>
  )
}
