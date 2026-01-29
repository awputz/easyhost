'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, FileText, Lightbulb, Wand2 } from 'lucide-react'
import { PageChat } from '@/types'

interface ChatPanelProps {
  pageId: string | null
  messages: PageChat[]
  onSendMessage: (message: string) => Promise<void>
  isGenerating: boolean
  streamingContent: string
}

const QUICK_PROMPTS = [
  { icon: FileText, label: 'Pitch Deck', prompt: 'Create a pitch deck for my startup that...' },
  { icon: Lightbulb, label: 'One-Pager', prompt: 'Create a one-page summary for...' },
  { icon: Wand2, label: 'Proposal', prompt: 'Write a professional proposal for...' },
]

export function ChatPanel({
  pageId,
  messages,
  onSendMessage,
  isGenerating,
  streamingContent,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const message = input.trim()
    setInput('')
    await onSendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Pagelink AI</h2>
            <p className="text-xs text-zinc-500">Describe your document</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Create beautiful documents with AI
            </h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-sm">
              Describe what you want to create and I'll generate a professional,
              interactive document for you.
            </p>

            {/* Quick Prompts */}
            <div className="w-full space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Quick Start</p>
              {QUICK_PROMPTS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left transition-colors"
                >
                  <item.icon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming Response */}
            {streamingContent && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-1" />
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isGenerating && !streamingContent && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="flex-1 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pageId ? "Describe changes or additions..." : "Describe the document you want to create..."}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
            rows={1}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2 p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: PageChat }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-zinc-700'
            : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-medium text-white">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`flex-1 rounded-lg p-3 ${
          isUser
            ? 'bg-violet-600/20 border border-violet-500/30'
            : 'bg-zinc-900 border border-zinc-800'
        }`}
      >
        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs text-zinc-600 mt-2">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
