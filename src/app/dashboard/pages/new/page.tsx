'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ChatPanel } from '@/components/pagelink/chat-panel'
import { PreviewPanel } from '@/components/pagelink/preview-panel'
import { PageChat, PageTheme, PageTemplateType } from '@/types'

export default function NewPagePage() {
  const router = useRouter()
  const [pageId, setPageId] = useState<string | null>(null)
  const [title, setTitle] = useState('Untitled Document')
  const [slug, setSlug] = useState<string | null>(null)
  const [html, setHtml] = useState('')
  const [theme, setTheme] = useState<PageTheme>('professional-dark')
  const [templateType, setTemplateType] = useState<PageTemplateType | null>(null)
  const [messages, setMessages] = useState<PageChat[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSendMessage = useCallback(async (message: string) => {
    setIsGenerating(true)
    setStreamingContent('')

    // Add user message immediately
    const userMessage: PageChat = {
      id: `temp-${Date.now()}`,
      page_id: pageId || '',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          pageId,
          templateType,
          theme,
          existingHtml: html,
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
      let accumulatedHtml = ''
      let assistantContent = ''

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
                accumulatedHtml += data.content
                assistantContent += data.content
                setStreamingContent(assistantContent)
                setHtml(accumulatedHtml)
              } else if (data.type === 'done') {
                if (data.pageId) {
                  setPageId(data.pageId)
                }
                if (data.html) {
                  setHtml(data.html)
                  // Extract title from HTML
                  const titleMatch = data.html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
                  if (titleMatch) {
                    setTitle(titleMatch[1].replace(/<[^>]+>/g, '').trim())
                  }
                }
              } else if (data.type === 'error') {
                console.error('Generation error:', data.message)
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: PageChat = {
        id: `temp-${Date.now()}-assistant`,
        page_id: pageId || '',
        role: 'assistant',
        content: 'Document generated successfully! You can see the preview on the right.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating:', error)
      // Add error message
      const errorMessage: PageChat = {
        id: `temp-${Date.now()}-error`,
        page_id: pageId || '',
        role: 'assistant',
        content: 'Sorry, there was an error generating your document. Please try again.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
    }
  }, [pageId, templateType, theme, html, messages])

  const handleSave = async () => {
    if (!html) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/pages', {
        method: pageId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          title,
          html,
          theme,
          templateType,
          isPublic: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      const data = await response.json()
      if (data.id && !pageId) {
        setPageId(data.id)
        setSlug(data.slug)
        // Redirect to edit page
        router.push(`/dashboard/pages/${data.id}`)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded px-2 py-1"
            placeholder="Untitled Document"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!html || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </header>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as PageTheme)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="professional-dark">Professional Dark</option>
                <option value="clean-light">Clean Light</option>
                <option value="corporate-blue">Corporate Blue</option>
                <option value="modern-minimal">Modern Minimal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Template</label>
              <select
                value={templateType || ''}
                onChange={(e) => setTemplateType(e.target.value as PageTemplateType || null)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="">Custom</option>
                <option value="pitch-deck">Pitch Deck</option>
                <option value="investment-memo">Investment Memo</option>
                <option value="proposal">Proposal</option>
                <option value="one-pager">One Pager</option>
                <option value="case-study">Case Study</option>
                <option value="report">Report</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[400px] flex-shrink-0 border-r border-zinc-800">
          <ChatPanel
            pageId={pageId}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
          />
        </div>

        {/* Preview Panel */}
        <div className="flex-1">
          <PreviewPanel
            html={html}
            theme={theme}
            title={title}
            slug={slug}
            isPublic={true}
          />
        </div>
      </div>
    </div>
  )
}
