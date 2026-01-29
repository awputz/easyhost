'use client'

import { useState, useEffect } from 'react'
import { X, History, RotateCcw, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Version {
  id: string
  version_number: number
  title: string | null
  created_at: string
}

interface VersionHistoryProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onRestore: (versionId: string) => Promise<void>
}

export function VersionHistory({
  isOpen,
  onClose,
  documentId,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, documentId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restore this version? Your current document will be saved as a new version.')) {
      return
    }

    setRestoringId(versionId)
    try {
      await onRestore(versionId)
      onClose()
    } catch (error) {
      console.error('Restore error:', error)
    } finally {
      setRestoringId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
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
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No version history yet</p>
              <p className="text-zinc-600 text-sm mt-1">
                Versions are created when you make changes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          Version {version.version_number}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      {version.title && (
                        <p className="text-sm text-zinc-400 truncate mt-0.5">
                          {version.title}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-xs text-zinc-500">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                    </div>

                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version.id)}
                        disabled={restoringId === version.id}
                        className="text-zinc-400 hover:text-white"
                      >
                        {restoringId === version.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900">
          <p className="text-xs text-zinc-500 text-center">
            Restoring a version creates a new version with the old content
          </p>
        </div>
      </div>
    </div>
  )
}
