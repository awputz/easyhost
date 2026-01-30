'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
        router.push(`/dashboard/pages/${data.id}`)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-navy-900 font-medium focus:outline-none focus:ring-2 focus:ring-navy-200 rounded px-2 py-1"
            placeholder="Untitled Document"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showSettings ? 'bg-navy-100 text-navy-900' : 'hover:bg-navy-50 text-navy-500'
            }`}
          >
            Settings
          </button>
          <button
            onClick={handleSave}
            disabled={!html || isSaving}
            className="px-4 py-1.5 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 disabled:text-navy-400 text-cream-50 rounded-lg transition-colors text-sm font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="flex-shrink-0 border-b border-navy-100 bg-white px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <label className="text-xs text-navy-400 block mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as PageTheme)}
                className="bg-white border border-navy-200 text-navy-900 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy-200"
              >
                <option value="professional-dark">Professional Dark</option>
                <option value="clean-light">Clean Light</option>
                <option value="corporate-blue">Corporate Blue</option>
                <option value="modern-minimal">Modern Minimal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-navy-400 block mb-1">Template</label>
              <select
                value={templateType || ''}
                onChange={(e) => setTemplateType(e.target.value as PageTemplateType || null)}
                className="bg-white border border-navy-200 text-navy-900 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy-200"
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[400px] flex-shrink-0 border-r border-navy-100 bg-white">
          <ChatPanel
            pageId={pageId}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
          />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-cream-100">
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
