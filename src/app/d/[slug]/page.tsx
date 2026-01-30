'use client'

import { useState, useCallback, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentSettings } from '@/components/pagelink/document-settings'
import { VersionHistory } from '@/components/pagelink/version-history'
import { ShareModal } from '@/components/pagelink/share-modal'
import { BrandingSettings, BrandingConfig } from '@/components/pagelink/branding-settings'
import { SEOSettings, SEOConfig } from '@/components/pagelink/seo-settings'
import { LeadCaptureSettings, LeadCaptureConfig } from '@/components/pagelink/lead-capture-settings'
import { EmbedSettings } from '@/components/pagelink/embed-settings'
import { FeedbackSettings, FeedbackConfig } from '@/components/pagelink/feedback-settings'
import { ABTestSettings, ABTestConfig } from '@/components/pagelink/ab-test-settings'
import { WebhookSettings, WebhookConfig } from '@/components/pagelink/webhook-settings'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Document {
  id: string
  slug: string
  title: string
  html: string
  theme: string
  document_type: string | null
  is_public: boolean
  has_password: boolean
  expires_at: string | null
  allowed_emails: string[] | null
  show_pagelink_badge: boolean
  view_count: number
  chat_history: ChatMessage[]
  custom_branding: BrandingConfig | null
  seo: SEOConfig | null
  lead_capture: LeadCaptureConfig | null
  feedback_config: FeedbackConfig | null
  ab_test_config: ABTestConfig | null
  webhook_config: WebhookConfig | null
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export default function DocumentEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [documentHtml, setDocumentHtml] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showBranding, setShowBranding] = useState(false)
  const [showSeo, setShowSeo] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showABTest, setShowABTest] = useState(false)
  const [showWebhooks, setShowWebhooks] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchDocument()
  }, [slug])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/pagelink/documents/by-slug/${slug}`)
      if (response.ok) {
        const doc = await response.json()
        setDocument(doc)
        setDocumentHtml(doc.html)
        setDocumentTitle(doc.title)
        if (doc.chat_history && Array.isArray(doc.chat_history)) {
          setMessages(doc.chat_history)
        }
      } else {
        router.push('/dashboard/pages')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      router.push('/dashboard/pages')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isGenerating || !document) return

    setInput('')
    setIsGenerating(true)
    setStreamingContent('')

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/pagelink/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          documentId: document.id,
          existingHtml: documentHtml,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullResponse = ''
      let extractedHtml = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'content') {
                fullResponse += data.content
                setStreamingContent(fullResponse)

                const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/)?.[1] ||
                                  fullResponse.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0]
                if (htmlMatch) {
                  extractedHtml = htmlMatch
                  setDocumentHtml(extractedHtml)
                  setHasUnsavedChanges(true)
                  const titleMatch = extractedHtml.match(/<title>([^<]+)<\/title>/i)
                  if (titleMatch) {
                    setDocumentTitle(titleMatch[1])
                  }
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: extractedHtml
          ? "I've updated your document. Check the preview!"
          : fullResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
    }
  }, [input, isGenerating, document, documentHtml, messages])

  const handleSave = async () => {
    if (!document || !documentHtml) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: documentTitle,
          html: documentHtml,
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsSave = async (settings: {
    slug: string
    isPublic: boolean
    password: string | null
    removePassword: boolean
    expiresAt: string | null
    allowedEmails: string[]
    showPagelinkBadge: boolean
    theme: string
  }) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: settings.slug,
        isPublic: settings.isPublic,
        password: settings.password,
        removePassword: settings.removePassword,
        expiresAt: settings.expiresAt,
        allowedEmails: settings.allowedEmails.length > 0 ? settings.allowedEmails : null,
        showPagelinkBadge: settings.showPagelinkBadge,
        theme: settings.theme,
      }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, ...updated })
      if (settings.slug !== slug) {
        router.push(`/d/${settings.slug}`)
      }
    } else {
      throw new Error('Failed to save settings')
    }
  }

  const handleDelete = async () => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.push('/dashboard/pages')
    }
  }

  const handleRestore = async (versionId: string) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    })

    if (response.ok) {
      const data = await response.json()
      setDocumentHtml(data.html)
      if (data.title) setDocumentTitle(data.title)
      setHasUnsavedChanges(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyLink = async () => {
    if (!document) return
    const url = `${window.location.origin}/${document.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!documentHtml) return
    const blob = new Blob([documentHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document?.slug || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDuplicate = async () => {
    if (!document) return

    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${document.id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/d/${data.slug}`)
      }
    } catch (error) {
      console.error('Duplicate error:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleArchive = async () => {
    if (!document) return

    if (!confirm('Archive this document? It will be moved to your archived documents.')) {
      return
    }

    setIsArchiving(true)
    try {
      const response = await fetch(`/api/pagelink/documents/${document.id}/archive`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/dashboard/pages')
      }
    } catch (error) {
      console.error('Archive error:', error)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleBrandingSave = async (branding: BrandingConfig) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customBranding: branding,
      }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, custom_branding: updated.custom_branding })
    } else {
      throw new Error('Failed to save branding')
    }
  }

  const handleSeoSave = async (seo: SEOConfig) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seo }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, seo: updated.seo })
    } else {
      throw new Error('Failed to save SEO settings')
    }
  }

  const handleLeadCaptureSave = async (leadCapture: LeadCaptureConfig) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadCapture }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, lead_capture: updated.lead_capture })
    } else {
      throw new Error('Failed to save lead capture settings')
    }
  }

  const handleFeedbackSave = async (feedbackConfig: FeedbackConfig) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackConfig }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, feedback_config: updated.feedback_config })
    } else {
      throw new Error('Failed to save feedback settings')
    }
  }

  const handleABTestSave = async (abTestConfig: ABTestConfig) => {
    if (!document) return

    if (abTestConfig.enabled && !abTestConfig.startedAt) {
      abTestConfig.startedAt = new Date().toISOString()
    }

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abTestConfig }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, ab_test_config: updated.ab_test_config })
    } else {
      throw new Error('Failed to save A/B test settings')
    }
  }

  const handleWebhookSave = async (webhookConfig: WebhookConfig) => {
    if (!document) return

    const response = await fetch(`/api/pagelink/documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookConfig }),
    })

    if (response.ok) {
      const updated = await response.json()
      setDocument({ ...document, webhook_config: updated.webhook_config })
    } else {
      throw new Error('Failed to save webhook settings')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream-50">
        <div className="text-navy-500">Loading...</div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${document.slug}`

  return (
    <div className="h-screen flex flex-col bg-cream-50">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-navy-100 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="p-2 hover:bg-navy-50 rounded-lg transition-colors text-navy-500"
          >
            &larr;
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
              <span className="text-cream-50 text-sm font-medium">AI</span>
            </div>
            <span className="font-serif font-semibold text-navy-900">{documentTitle}</span>
            {hasUnsavedChanges && (
              <span className="text-xs text-navy-400">• Unsaved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Slug display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cream-100 rounded-lg border border-navy-100">
            <span className="text-sm text-navy-500 font-mono truncate max-w-[160px]">
              /{document.slug}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 hover:bg-navy-100 rounded transition-colors text-navy-500"
            >
              {copied ? '✓' : '⎘'}
            </button>
          </div>

          {/* Quick actions */}
          <Link href={`/d/${document.slug}/analytics`} className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors">
            Analytics
          </Link>

          <button onClick={() => setShowShareModal(true)} className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors">
            Share
          </button>

          <button onClick={() => setShowSettings(true)} className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors">
            Settings
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors"
            >
              More
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-navy-100 py-1 w-48 z-20">
                  <button onClick={() => { setShowEmbed(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Embed Code</button>
                  <button onClick={() => { setShowHistory(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Version History</button>
                  <button onClick={() => { setShowBranding(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Branding</button>
                  <button onClick={() => { setShowSeo(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">SEO Settings</button>
                  <button onClick={() => { setShowLeadCapture(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Lead Capture</button>
                  <Link href={`/d/${document.slug}/leads`} className="block px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">View Leads</Link>
                  <button onClick={() => { setShowFeedback(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Feedback Settings</button>
                  <Link href={`/d/${document.slug}/feedback`} className="block px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">View Feedback</Link>
                  <button onClick={() => { setShowABTest(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">A/B Testing</button>
                  <Link href={`/d/${document.slug}/ab-test`} className="block px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">A/B Test Results</Link>
                  <button onClick={() => { setShowWebhooks(true); setShowMoreMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Webhooks</button>
                  <Link href={`/d/${document.slug}/webhooks`} className="block px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Webhook Logs</Link>
                  <hr className="my-1 border-navy-100" />
                  <button onClick={() => { handleDuplicate(); setShowMoreMenu(false); }} disabled={isDuplicating} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 disabled:opacity-50">
                    {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                  </button>
                  <button onClick={handleDownload} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">Download HTML</button>
                  <button onClick={() => { handleArchive(); setShowMoreMenu(false); }} disabled={isArchiving} className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-navy-50 disabled:opacity-50">
                    {isArchiving ? 'Archiving...' : 'Archive'}
                  </button>
                </div>
              </>
            )}
          </div>

          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-2 text-navy-600 border border-navy-200 hover:bg-navy-50 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
          >
            View Live →
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[380px] flex-shrink-0 border-r border-navy-100 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">
                  Edit with AI
                </h3>
                <p className="text-sm text-navy-500">
                  Describe the changes you want to make
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                        message.role === 'user'
                          ? 'bg-navy-100 text-navy-600'
                          : 'bg-navy-800 text-cream-50'
                      }`}
                    >
                      {message.role === 'user' ? 'You' : 'AI'}
                    </div>
                    <div
                      className={`flex-1 rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-navy-800 text-cream-50'
                          : 'bg-cream-100 border border-navy-100 text-navy-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
                      <span className="text-cream-50 text-sm font-medium">AI</span>
                    </div>
                    <div className="flex-1 bg-cream-100 rounded-lg p-3 border border-navy-100">
                      <p className="text-sm text-navy-700">
                        Updating document...
                        <span className="inline-block w-2 h-4 bg-navy-600 animate-pulse ml-1" />
                      </p>
                    </div>
                  </div>
                )}

                {isGenerating && !streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
                      <span className="text-cream-50 text-sm animate-pulse">...</span>
                    </div>
                    <div className="flex-1 bg-cream-100 rounded-lg p-3 border border-navy-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce [animation-delay:100ms]" />
                        <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce [animation-delay:200ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-navy-100">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes..."
                className="w-full bg-cream-50 border border-navy-200 rounded-xl px-4 py-3 pr-12 text-sm text-navy-800 placeholder-navy-400 resize-none focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-navy-300"
                rows={1}
                disabled={isGenerating}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isGenerating}
                className="absolute right-2 bottom-2 p-2 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 disabled:text-navy-400 text-cream-50 rounded-lg transition-colors"
              >
                {isGenerating ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-cream-100">
          <div className="flex-shrink-0 px-4 py-2 border-b border-navy-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-lg">
              <button
                onClick={() => setDeviceSize('desktop')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  deviceSize === 'desktop'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setDeviceSize('tablet')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  deviceSize === 'tablet'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                Tablet
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  deviceSize === 'mobile'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                Mobile
              </button>
            </div>

            <span className="text-sm text-navy-500">
              {document.view_count} views
            </span>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div
              className="h-full mx-auto transition-all duration-300"
              style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
            >
              <iframe
                srcDoc={documentHtml}
                className="w-full h-full bg-white rounded-xl shadow-lg border border-navy-100"
                title="Document Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        document={{
          id: document.id,
          slug: document.slug,
          title: documentTitle,
          theme: document.theme,
          isPublic: document.is_public,
          hasPassword: document.has_password,
          expiresAt: document.expires_at,
          allowedEmails: document.allowed_emails,
          showPagelinkBadge: document.show_pagelink_badge,
        }}
        onSave={handleSettingsSave}
        onDelete={handleDelete}
      />

      <VersionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        documentId={document.id}
        onRestore={handleRestore}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentSlug={document.slug}
        documentTitle={documentTitle}
        documentHtml={documentHtml}
        documentId={document.id}
      />

      <BrandingSettings
        isOpen={showBranding}
        onClose={() => setShowBranding(false)}
        branding={document.custom_branding || {
          logoUrl: null,
          primaryColor: '#3B82F6',
          accentColor: '#60A5FA',
          fontFamily: 'inter',
          footerText: null,
          footerLink: null,
          customCss: null,
        }}
        onSave={handleBrandingSave}
      />

      <SEOSettings
        isOpen={showSeo}
        onClose={() => setShowSeo(false)}
        document={{
          id: document.id,
          slug: document.slug,
          title: documentTitle,
          seo: document.seo,
        }}
        onSave={handleSeoSave}
      />

      <LeadCaptureSettings
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        config={document.lead_capture || {
          enabled: false,
          requireEmail: true,
          requireName: false,
          requireCompany: false,
          requirePhone: false,
          customFields: [],
          headline: 'Get access to this document',
          description: 'Enter your email to view the full document.',
          buttonText: 'Continue',
          showPreview: true,
          previewPercentage: 30,
        }}
        onSave={handleLeadCaptureSave}
      />

      <EmbedSettings
        isOpen={showEmbed}
        onClose={() => setShowEmbed(false)}
        documentSlug={document.slug}
        documentTitle={documentTitle}
      />

      <FeedbackSettings
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        config={document.feedback_config || {
          enabled: false,
          feedbackType: 'comments',
          allowAnonymous: true,
          requireEmail: false,
          moderationEnabled: true,
          notifyOnNew: false,
          notifyEmail: null,
          placeholder: 'Share your thoughts on this document...',
          thankYouMessage: 'Thank you for your feedback!',
          position: 'bottom-right',
        }}
        onSave={handleFeedbackSave}
      />

      <ABTestSettings
        isOpen={showABTest}
        onClose={() => setShowABTest(false)}
        documentId={document.id}
        documentHtml={documentHtml}
        config={document.ab_test_config || null}
        onSave={handleABTestSave}
      />

      <WebhookSettings
        isOpen={showWebhooks}
        onClose={() => setShowWebhooks(false)}
        documentId={document.id}
        config={document.webhook_config || null}
        onSave={handleWebhookSave}
      />
    </div>
  )
}
