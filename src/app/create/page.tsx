'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export default function CreatePage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [documentHtml, setDocumentHtml] = useState('')
  const [documentSlug, setDocumentSlug] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState('Untitled Document')
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check for initial prompt from homepage
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem('pagelink_initial_prompt')
    if (initialPrompt) {
      sessionStorage.removeItem('pagelink_initial_prompt')
      setInput(initialPrompt)
      setTimeout(() => {
        handleSendMessage(initialPrompt)
      }, 100)
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isGenerating) return

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
          documentId: documentSlug,
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
                  const titleMatch = extractedHtml.match(/<title>([^<]+)<\/title>/i)
                  if (titleMatch) {
                    setDocumentTitle(titleMatch[1])
                  }
                }
              } else if (data.type === 'done') {
                if (data.slug) {
                  setDocumentSlug(data.slug)
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

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: extractedHtml
          ? "I've created your document. You can see the preview on the right. Let me know if you'd like any changes!"
          : fullResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error generating your document. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
    }
  }, [input, isGenerating, documentSlug, documentHtml, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyLink = async () => {
    if (!documentSlug) return
    const url = `${window.location.origin}/${documentSlug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!documentHtml) return
    const blob = new Blob([documentHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentSlug || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveAndEdit = async () => {
    if (!documentHtml) return

    setIsSaving(true)
    try {
      if (documentSlug) {
        router.push(`/d/${documentSlug}`)
        return
      }

      const response = await fetch('/api/pagelink/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: documentTitle,
          html: documentHtml,
          document_type: 'custom',
          theme: 'midnight',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save document')
      }

      const data = await response.json()
      if (data.slug) {
        setDocumentSlug(data.slug)
        router.push(`/d/${data.slug}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save document. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const publicUrl = documentSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${documentSlug}` : null

  return (
    <div className="h-screen flex flex-col bg-cream-50">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-navy-100 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-navy-50 rounded-lg transition-colors text-navy-500"
          >
            &larr;
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
              <span className="text-cream-50 text-sm font-medium">AI</span>
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-lg font-serif font-semibold text-navy-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-navy-300 w-64"
              placeholder="Untitled Document"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {publicUrl && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cream-100 rounded-lg border border-navy-100">
              <span className="text-sm text-navy-500 font-mono truncate max-w-[200px]">
                /{documentSlug}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1 hover:bg-navy-100 rounded transition-colors text-navy-500"
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          )}

          {documentHtml && (
            <>
              <button
                onClick={handleDownload}
                className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors"
              >
                Download
              </button>

              <button
                onClick={handleCopyLink}
                disabled={!documentSlug}
                className="px-3 py-2 text-navy-600 hover:bg-navy-50 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Share
              </button>

              <button
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleSaveAndEdit}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save & Edit'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[380px] flex-shrink-0 border-r border-navy-100 flex flex-col bg-white">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-navy-900 mb-2">
                  Describe your document
                </h3>
                <p className="text-sm text-navy-500 mb-8">
                  Tell me what you want to create and I&apos;ll build a beautiful, shareable page for you.
                </p>
                <div className="space-y-2 w-full">
                  <p className="font-mono text-xs text-navy-400 uppercase tracking-wider mb-3">
                    Quick Examples
                  </p>
                  {[
                    'Create a pitch deck for my AI startup',
                    'Make an investment memo for a real estate deal',
                    'Build a consulting proposal for a 3-month project',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(example)
                        setTimeout(() => handleSendMessage(example), 100)
                      }}
                      className="w-full text-left p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 text-sm text-navy-700 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
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

                {/* Streaming Response */}
                {streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
                      <span className="text-cream-50 text-sm font-medium">AI</span>
                    </div>
                    <div className="flex-1 bg-cream-100 rounded-lg p-3 border border-navy-100">
                      <p className="text-sm text-navy-700">
                        Generating your document...
                        <span className="inline-block w-2 h-4 bg-navy-600 animate-pulse ml-1" />
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading */}
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

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-navy-100">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create or change..."
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
            <p className="text-xs text-navy-400 mt-2 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-cream-100">
          {/* Preview Header */}
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

            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
              >
                Open in new tab →
              </a>
            )}
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-6">
            <div
              className="h-full mx-auto transition-all duration-300"
              style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
            >
              {documentHtml ? (
                <iframe
                  srcDoc={documentHtml}
                  className="w-full h-full bg-white rounded-xl shadow-lg border border-navy-100"
                  title="Document Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-navy-200 bg-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">✨</span>
                    </div>
                    <p className="text-navy-700 text-lg font-medium font-serif">
                      Your document will appear here
                    </p>
                    <p className="text-navy-500 text-sm mt-2">
                      Describe what you want to create in the chat
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
