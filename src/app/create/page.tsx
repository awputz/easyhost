'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [showSettings, setShowSettings] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check for initial prompt from homepage
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem('pagelink_initial_prompt')
    if (initialPrompt) {
      sessionStorage.removeItem('pagelink_initial_prompt')
      setInput(initialPrompt)
      // Auto-submit after a short delay
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

    // Add user message
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

                // Extract HTML from response
                const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/)?.[1] ||
                                  fullResponse.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0]
                if (htmlMatch) {
                  extractedHtml = htmlMatch
                  setDocumentHtml(extractedHtml)
                  // Extract title
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

      // Add assistant message (summarized response)
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

  const publicUrl = documentSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${documentSlug}` : null

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-white">{documentTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {publicUrl && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-sm text-zinc-400 font-mono truncate max-w-[200px]">
                pagelink.com/{documentSlug}
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
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? 'bg-zinc-800' : ''}
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>

          {documentHtml && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5 text-zinc-400" />
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-500"
                onClick={handleCopyLink}
                disabled={!documentSlug}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0a0a0a]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-violet-600/20 rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Describe your document
                </h3>
                <p className="text-sm text-zinc-500 mb-6">
                  Tell me what you want to create and I'll build a beautiful, shareable page for you.
                </p>
                <div className="space-y-2 w-full">
                  <p className="text-xs text-zinc-600 uppercase tracking-wide">Quick Examples</p>
                  {[
                    'Create a pitch deck for my AI startup',
                    'Make an investment memo for 146 West 28th St',
                    'Build a consulting proposal for a 3-month project',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(example)
                        setTimeout(() => handleSendMessage(example), 100)
                      }}
                      className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm text-zinc-300 transition-colors"
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

                {/* Streaming Response */}
                {streamingContent && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                      <p className="text-sm text-zinc-300">
                        Generating your document...
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading */}
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

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-white/5">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create or change..."
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
            <p className="text-xs text-zinc-600 mt-2 text-center">
              Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Preview Header */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeviceSize('desktop')}
                className={`p-2 rounded ${
                  deviceSize === 'desktop' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('tablet')}
                className={`p-2 rounded ${
                  deviceSize === 'tablet' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Tablet"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                className={`p-2 rounded ${
                  deviceSize === 'mobile' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </a>
            )}
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-6 bg-zinc-900">
            <div
              className="h-full mx-auto transition-all duration-300"
              style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
            >
              {documentHtml ? (
                <iframe
                  srcDoc={documentHtml}
                  className="w-full h-full bg-white rounded-lg shadow-2xl"
                  title="Document Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-800">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 text-lg font-medium">
                      Your document will appear here
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">
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
