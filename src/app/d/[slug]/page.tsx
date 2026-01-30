'use client'

import { useState, useCallback, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Download,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  Share2,
  History,
  Save,
  BarChart3,
  Files,
  Archive,
  Palette,
  Search,
  Users,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentSettings } from '@/components/pagelink/document-settings'
import { VersionHistory } from '@/components/pagelink/version-history'
import { ShareModal } from '@/components/pagelink/share-modal'
import { BrandingSettings, BrandingConfig } from '@/components/pagelink/branding-settings'
import { SEOSettings, SEOConfig } from '@/components/pagelink/seo-settings'
import { LeadCaptureSettings, LeadCaptureConfig } from '@/components/pagelink/lead-capture-settings'

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

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
      // First try to find by slug in pagelink_documents
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
        // Document not found, redirect
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return null
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${document.slug}`

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-white">{documentTitle}</span>
            {hasUnsavedChanges && (
              <span className="text-xs text-zinc-500">• Unsaved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
            <span className="text-sm text-zinc-400 font-mono truncate max-w-[180px]">
              /{document.slug}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>

          <Link href={`/d/${document.slug}/analytics`}>
            <Button
              variant="ghost"
              size="icon"
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5 text-zinc-400" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShareModal(true)}
            title="Share"
          >
            <Share2 className="w-5 h-5 text-zinc-400" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(true)}
            title="Version History"
          >
            <History className="w-5 h-5 text-zinc-400" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBranding(true)}
            title="Branding"
          >
            <Palette className="w-5 h-5 text-zinc-400" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSeo(true)}
            title="SEO Settings"
          >
            <Search className="w-5 h-5 text-zinc-400" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLeadCapture(true)}
            title="Lead Capture Settings"
          >
            <Users className="w-5 h-5 text-zinc-400" />
          </Button>

          <Link href={`/d/${document.slug}/leads`}>
            <Button
              variant="ghost"
              size="icon"
              title="View Leads"
            >
              <ClipboardList className="w-5 h-5 text-zinc-400" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            title="Duplicate"
          >
            {isDuplicating ? (
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            ) : (
              <Files className="w-5 h-5 text-zinc-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchive}
            disabled={isArchiving}
            title="Archive"
          >
            {isArchiving ? (
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            ) : (
              <Archive className="w-5 h-5 text-zinc-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download HTML"
          >
            <Download className="w-5 h-5 text-zinc-400" />
          </Button>

          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="border-zinc-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          )}

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-blue-600 hover:bg-blue-500">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0a0a0a]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-violet-600/20 rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Edit with AI
                </h3>
                <p className="text-sm text-zinc-500">
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
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-zinc-700'
                          : 'bg-gradient-to-br from-blue-500 to-violet-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <span className="text-xs font-medium text-white">You</span>
                      ) : (
                        <Sparkles className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`flex-1 rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-zinc-900 border border-zinc-800'
                      }`}
                    >
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                      <p className="text-sm text-zinc-300">
                        Updating document...
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                      </p>
                    </div>
                  </div>
                )}

                {isGenerating && !streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:100ms]" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-white/5">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                rows={1}
                disabled={isGenerating}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isGenerating}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeviceSize('desktop')}
                className={`p-2 rounded ${
                  deviceSize === 'desktop' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('tablet')}
                className={`p-2 rounded ${
                  deviceSize === 'tablet' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                className={`p-2 rounded ${
                  deviceSize === 'mobile' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <span className="text-sm text-zinc-500">
              {document.view_count} views
            </span>
          </div>

          <div className="flex-1 overflow-auto p-6 bg-zinc-900">
            <div
              className="h-full mx-auto transition-all duration-300"
              style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
            >
              <iframe
                srcDoc={documentHtml}
                className="w-full h-full bg-white rounded-lg shadow-2xl"
                title="Document Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
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

      {/* Version History Modal */}
      <VersionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        documentId={document.id}
        onRestore={handleRestore}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentSlug={document.slug}
        documentTitle={documentTitle}
        documentHtml={documentHtml}
        documentId={document.id}
      />

      {/* Branding Modal */}
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

      {/* SEO Modal */}
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

      {/* Lead Capture Modal */}
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
    </div>
  )
}
