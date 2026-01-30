'use client'

import { useState } from 'react'
import {
  X,
  Webhook,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  secret: string
  enabled: boolean
  events: WebhookEvent[]
  createdAt: string
  lastTriggeredAt?: string | null
  failureCount: number
}

export type WebhookEvent =
  | 'document.viewed'
  | 'document.created'
  | 'document.updated'
  | 'document.deleted'
  | 'lead.captured'
  | 'feedback.submitted'
  | 'ab_test.conversion'

export interface WebhookConfig {
  enabled: boolean
  endpoints: WebhookEndpoint[]
  globalSecret?: string | null
}

interface WebhookSettingsProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  config: WebhookConfig | null
  onSave: (config: WebhookConfig) => Promise<void>
}

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'document.viewed', label: 'Document Viewed', description: 'When someone views the document' },
  { value: 'document.created', label: 'Document Created', description: 'When the document is created' },
  { value: 'document.updated', label: 'Document Updated', description: 'When the document is modified' },
  { value: 'document.deleted', label: 'Document Deleted', description: 'When the document is deleted' },
  { value: 'lead.captured', label: 'Lead Captured', description: 'When a lead submits their info' },
  { value: 'feedback.submitted', label: 'Feedback Submitted', description: 'When feedback is submitted' },
  { value: 'ab_test.conversion', label: 'A/B Test Conversion', description: 'When an A/B test conversion occurs' },
]

const DEFAULT_CONFIG: WebhookConfig = {
  enabled: false,
  endpoints: [],
  globalSecret: null,
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'whsec_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function WebhookSettings({
  isOpen,
  onClose,
  documentId,
  config,
  onSave,
}: WebhookSettingsProps) {
  const [settings, setSettings] = useState<WebhookConfig>(config || DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [showNewEndpoint, setShowNewEndpoint] = useState(false)
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    events: [] as WebhookEvent[],
  })
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addEndpoint = () => {
    if (!newEndpoint.name.trim() || !newEndpoint.url.trim() || newEndpoint.events.length === 0) return

    const endpoint: WebhookEndpoint = {
      id: `webhook-${Date.now()}`,
      name: newEndpoint.name.trim(),
      url: newEndpoint.url.trim(),
      secret: generateSecret(),
      enabled: true,
      events: newEndpoint.events,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      failureCount: 0,
    }

    setSettings({
      ...settings,
      endpoints: [...settings.endpoints, endpoint],
    })
    setNewEndpoint({ name: '', url: '', events: [] })
    setShowNewEndpoint(false)
  }

  const removeEndpoint = (endpointId: string) => {
    setSettings({
      ...settings,
      endpoints: settings.endpoints.filter(e => e.id !== endpointId),
    })
  }

  const toggleEndpoint = (endpointId: string) => {
    setSettings({
      ...settings,
      endpoints: settings.endpoints.map(e =>
        e.id === endpointId ? { ...e, enabled: !e.enabled } : e
      ),
    })
  }

  const toggleEvent = (event: WebhookEvent) => {
    if (newEndpoint.events.includes(event)) {
      setNewEndpoint({
        ...newEndpoint,
        events: newEndpoint.events.filter(e => e !== event),
      })
    } else {
      setNewEndpoint({
        ...newEndpoint,
        events: [...newEndpoint.events, event],
      })
    }
  }

  const copySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const toggleSecretVisibility = (endpointId: string) => {
    const newVisible = new Set(visibleSecrets)
    if (newVisible.has(endpointId)) {
      newVisible.delete(endpointId)
    } else {
      newVisible.add(endpointId)
    }
    setVisibleSecrets(newVisible)
  }

  const regenerateSecret = (endpointId: string) => {
    setSettings({
      ...settings,
      endpoints: settings.endpoints.map(e =>
        e.id === endpointId ? { ...e, secret: generateSecret() } : e
      ),
    })
  }

  const testEndpoint = async (endpoint: WebhookEndpoint) => {
    setTestingEndpoint(endpoint.id)
    setTestResult(null)

    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId: endpoint.id,
          url: endpoint.url,
          secret: endpoint.secret,
        }),
      })

      const data = await response.json()
      setTestResult({
        id: endpoint.id,
        success: response.ok && data.success,
        message: data.message || (response.ok ? 'Test successful!' : 'Test failed'),
      })
    } catch {
      setTestResult({
        id: endpoint.id,
        success: false,
        message: 'Failed to send test webhook',
      })
    } finally {
      setTestingEndpoint(null)
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
            <Webhook className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Webhooks</h2>
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
          {/* Enable Toggle */}
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Webhook className="w-4 h-4 text-orange-400" />
                Enable Webhooks
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Send real-time notifications to external services
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className="text-2xl"
            >
              {settings.enabled ? (
                <ToggleRight className="w-10 h-10 text-orange-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-zinc-600" />
              )}
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Endpoints List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">
                    Webhook Endpoints
                  </label>
                  <span className="text-xs text-zinc-500">
                    {settings.endpoints.length} configured
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {settings.endpoints.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEndpoint(endpoint.id)}
                            className="text-lg"
                          >
                            {endpoint.enabled ? (
                              <ToggleRight className="w-6 h-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-zinc-600" />
                            )}
                          </button>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {endpoint.name}
                              {endpoint.failureCount > 0 && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                  {endpoint.failureCount} failures
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 truncate max-w-[300px]">
                              {endpoint.url}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeEndpoint(endpoint.id)}
                          className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Events */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {endpoint.events.map((event) => (
                          <span
                            key={event}
                            className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>

                      {/* Secret */}
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-2">
                        <code className="flex-1 text-xs text-zinc-400 font-mono truncate">
                          {visibleSecrets.has(endpoint.id)
                            ? endpoint.secret
                            : '•'.repeat(20)}
                        </code>
                        <button
                          onClick={() => toggleSecretVisibility(endpoint.id)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                          title={visibleSecrets.has(endpoint.id) ? 'Hide' : 'Show'}
                        >
                          {visibleSecrets.has(endpoint.id) ? (
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => copySecret(endpoint.secret)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedSecret === endpoint.secret ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => regenerateSecret(endpoint.id)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      </div>

                      {/* Test & Status */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
                        <div className="text-xs text-zinc-500">
                          {endpoint.lastTriggeredAt
                            ? `Last triggered: ${new Date(endpoint.lastTriggeredAt).toLocaleString()}`
                            : 'Never triggered'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testEndpoint(endpoint)}
                          disabled={testingEndpoint === endpoint.id}
                          className="border-zinc-600 text-xs"
                        >
                          {testingEndpoint === endpoint.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : null}
                          Test
                        </Button>
                      </div>

                      {/* Test Result */}
                      {testResult?.id === endpoint.id && (
                        <div
                          className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${
                            testResult.success
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {testResult.success ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Endpoint */}
                {showNewEndpoint ? (
                  <div className="bg-zinc-800 rounded-lg p-4 border border-orange-500/30">
                    <h4 className="font-medium text-white mb-3">New Webhook Endpoint</h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={newEndpoint.name}
                          onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                          placeholder="e.g., Zapier Integration"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">URL</label>
                        <input
                          type="url"
                          value={newEndpoint.url}
                          onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                          placeholder="https://hooks.zapier.com/..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 mb-2">Events</label>
                        <div className="grid grid-cols-2 gap-2">
                          {WEBHOOK_EVENTS.map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => toggleEvent(value)}
                              className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                                newEndpoint.events.includes(value)
                                  ? 'bg-orange-500/20 border-orange-500 text-white'
                                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewEndpoint(false)
                          setNewEndpoint({ name: '', url: '', events: [] })
                        }}
                        className="border-zinc-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addEndpoint}
                        disabled={!newEndpoint.name.trim() || !newEndpoint.url.trim() || newEndpoint.events.length === 0}
                        className="bg-orange-600 hover:bg-orange-500"
                      >
                        Add Endpoint
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowNewEndpoint(true)}
                    className="w-full border-zinc-700 border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook Endpoint
                  </Button>
                )}

                {settings.endpoints.length === 0 && !showNewEndpoint && (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No webhook endpoints configured
                  </div>
                )}
              </div>

              {/* Integration Examples */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h4 className="text-sm font-medium text-white mb-3">Popular Integrations</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Zapier', color: 'bg-orange-500' },
                    { name: 'Make', color: 'bg-purple-500' },
                    { name: 'Slack', color: 'bg-green-500' },
                    { name: 'Discord', color: 'bg-indigo-500' },
                    { name: 'n8n', color: 'bg-pink-500' },
                    { name: 'Custom', color: 'bg-zinc-500' },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg"
                    >
                      <div className={`w-2 h-2 rounded-full ${integration.color}`} />
                      <span className="text-xs text-zinc-400">{integration.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500">
            {settings.enabled ? (
              settings.endpoints.length > 0 ? (
                <span className="flex items-center gap-1 text-orange-400">
                  <Webhook className="w-3 h-3" />
                  {settings.endpoints.filter(e => e.enabled).length} active endpoints
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  Add at least one endpoint
                </span>
              )
            ) : (
              <span>Webhooks are disabled</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-500"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
