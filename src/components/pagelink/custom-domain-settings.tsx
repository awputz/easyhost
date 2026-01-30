'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CustomDomain {
  id: string
  domain: string
  status: 'pending' | 'verified' | 'failed'
  verificationToken: string
  verifiedAt: string | null
  createdAt: string
}

interface CustomDomainSettingsProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  documentId?: string // If provided, domain is for a specific document
}

export function CustomDomainSettings({
  isOpen,
  onClose,
  workspaceId,
  documentId,
}: CustomDomainSettingsProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDomains()
    }
  }, [isOpen, workspaceId])

  const fetchDomains = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ workspaceId })
      if (documentId) params.append('documentId', documentId)

      const response = await fetch(`/api/domains?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    // Basic domain validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(newDomain.trim())) {
      setError('Please enter a valid domain (e.g., docs.example.com)')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim().toLowerCase(),
          workspaceId,
          documentId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add domain')
      }

      const data = await response.json()
      setDomains([...domains, data.domain])
      setNewDomain('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain')
    } finally {
      setIsAdding(false)
    }
  }

  const handleVerifyDomain = async (domainId: string) => {
    setVerifying(domainId)
    setError(null)

    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Verification failed')
      }

      const data = await response.json()
      setDomains(domains.map(d =>
        d.id === domainId ? { ...d, status: data.verified ? 'verified' : 'failed' } : d
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(null)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId))
      }
    } catch (err) {
      console.error('Failed to delete domain:', err)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusIcon = (status: CustomDomain['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-amber-500" />
    }
  }

  const getStatusText = (status: CustomDomain['status']) => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'failed':
        return 'Verification Failed'
      default:
        return 'Pending Verification'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Custom Domains</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">How custom domains work:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                  <li>Add your domain below</li>
                  <li>Create a CNAME record pointing to <code className="bg-blue-500/20 px-1 rounded">cname.pagelink.com</code></li>
                  <li>Add a TXT record for verification</li>
                  <li>Click verify once DNS propagates (up to 48 hours)</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Add Domain */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Add Custom Domain
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="docs.yourdomain.com"
              />
              <Button
                onClick={handleAddDomain}
                disabled={isAdding || !newDomain.trim()}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* Domain List */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Your Domains
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No custom domains configured
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700"
                  >
                    {/* Domain Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(domain.status)}
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {domain.domain}
                            {domain.status === 'verified' && (
                              <a
                                href={`https://${domain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {getStatusText(domain.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {domain.status !== 'verified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyDomain(domain.id)}
                            disabled={verifying === domain.id}
                            className="border-zinc-600"
                          >
                            {verifying === domain.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            <span className="ml-1">Verify</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDomain(domain.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* DNS Records (show only if not verified) */}
                    {domain.status !== 'verified' && (
                      <div className="space-y-3 pt-3 border-t border-zinc-700">
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                          Required DNS Records
                        </div>

                        {/* CNAME Record */}
                        <div className="bg-zinc-900 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-zinc-400">CNAME Record</span>
                            <button
                              onClick={() => handleCopy('cname.pagelink.com', `cname-${domain.id}`)}
                              className="text-zinc-500 hover:text-white"
                            >
                              {copied === `cname-${domain.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-zinc-500">Host:</span>
                              <span className="ml-2 text-white font-mono">
                                {domain.domain.split('.')[0]}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Value:</span>
                              <span className="ml-2 text-white font-mono">
                                cname.pagelink.com
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* TXT Record */}
                        <div className="bg-zinc-900 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-zinc-400">TXT Record (Verification)</span>
                            <button
                              onClick={() => handleCopy(domain.verificationToken, `txt-${domain.id}`)}
                              className="text-zinc-500 hover:text-white"
                            >
                              {copied === `txt-${domain.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-zinc-500">Host:</span>
                              <span className="ml-2 text-white font-mono">
                                _pagelink.{domain.domain.split('.')[0]}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Value:</span>
                              <span className="ml-2 text-white font-mono break-all">
                                {domain.verificationToken}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose} className="w-full border-zinc-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
