'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Webhook,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Filter,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebhookLog {
  id: string
  document_id: string
  endpoint_id: string
  event_type: string
  success: boolean
  status_code: number
  error_message?: string
  created_at: string
}

interface WebhookStats {
  total: number
  successful: number
  failed: number
  successRate: string
}

interface WebhookEndpoint {
  id: string
  name: string
  url: string
}

export default function WebhookLogsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [documentId, setDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [endpointFilter, setEndpointFilter] = useState<string>('')
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    fetchDocument()
  }, [slug])

  useEffect(() => {
    if (documentId) {
      fetchLogs()
      fetchConfig()
    }
  }, [documentId, filter, endpointFilter])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/pagelink/documents/by-slug/${slug}`)
      if (response.ok) {
        const doc = await response.json()
        setDocumentId(doc.id)
      } else {
        router.push('/dashboard/pages')
      }
    } catch {
      router.push('/dashboard/pages')
    }
  }

  const fetchConfig = async () => {
    if (!documentId) return

    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/webhooks`)
      if (response.ok) {
        const data = await response.json()
        if (data.config?.endpoints) {
          setEndpoints(data.config.endpoints.map((e: WebhookEndpoint) => ({
            id: e.id,
            name: e.name,
            url: e.url,
          })))
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const fetchLogs = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      let url = `/api/pagelink/documents/${documentId}/webhooks/logs?limit=100`

      if (filter === 'success') {
        url += '&success=true'
      } else if (filter === 'failed') {
        url += '&failed=true'
      }

      if (endpointFilter) {
        url += `&endpointId=${endpointFilter}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!documentId) return
    if (!confirm('Are you sure you want to clear all webhook logs? This cannot be undone.')) return

    setIsClearing(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/webhooks/logs`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLogs([])
        setStats({ total: 0, successful: 0, failed: 0, successRate: '0' })
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const getEndpointName = (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId)
    return endpoint?.name || 'Unknown Endpoint'
  }

  const formatEventType = (event: string) => {
    return event
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-cream-50/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/d/${slug}`}
                className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-navy-500" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Webhook className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-navy-900">Webhook Logs</h1>
                  <p className="text-sm text-navy-400">View delivery history and troubleshoot issues</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={loading}
                className="border-navy-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={isClearing || logs.length === 0}
                className="border-navy-200 text-red-400 hover:text-red-300"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <div className="text-2xl font-bold text-navy-900">{stats.total}</div>
              <div className="text-sm text-navy-400">Total Deliveries</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <div className="text-2xl font-bold text-green-400">{stats.successful}</div>
              <div className="text-sm text-navy-400">Successful</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
              <div className="text-sm text-navy-400">Failed</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-navy-100">
              <div className="text-2xl font-bold text-orange-400">{stats.successRate}%</div>
              <div className="text-sm text-navy-400">Success Rate</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy-400" />
            <span className="text-sm text-navy-500">Filter:</span>
          </div>

          <div className="flex gap-2">
            {(['all', 'success', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === f
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-navy-100 text-navy-500 border border-navy-200 hover:border-zinc-600'
                }`}
              >
                {f === 'all' ? 'All' : f === 'success' ? 'Successful' : 'Failed'}
              </button>
            ))}
          </div>

          {endpoints.length > 0 && (
            <select
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="bg-navy-100 border border-navy-200 rounded-lg px-3 py-1.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All Endpoints</option>
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-navy-100">
            <Webhook className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-navy-500">No webhook deliveries yet</p>
            <p className="text-sm text-navy-500 mt-1">
              Webhook events will appear here when triggered
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-4 py-3">
                    Event
                  </th>
                  <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-4 py-3">
                    Endpoint
                  </th>
                  <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-4 py-3">
                    Response
                  </th>
                  <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-4 py-3">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`border-b border-navy-100/50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-white/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {log.success ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Failed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-navy-900 font-medium">
                        {formatEventType(log.event_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-navy-500">
                        {getEndpointName(log.endpoint_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status_code > 0 ? (
                        <span
                          className={`text-sm ${
                            log.status_code >= 200 && log.status_code < 300
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {log.status_code}
                        </span>
                      ) : (
                        <span className="text-sm text-navy-400">
                          {log.error_message || 'No response'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-navy-400">
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white/50 rounded-xl p-6 border border-navy-100">
          <h3 className="text-sm font-medium text-navy-900 mb-3">Troubleshooting Tips</h3>
          <ul className="space-y-2 text-sm text-navy-500">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Ensure your webhook endpoint returns a 2xx status code within 10 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Verify the webhook signature using your endpoint&apos;s secret key</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Check that your server can receive POST requests with JSON body</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>
                <a
                  href="https://docs.pagelink.com/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                >
                  View full documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
