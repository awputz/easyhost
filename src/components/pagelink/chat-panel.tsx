'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Building2, FileText, TrendingUp } from 'lucide-react'
import { PageChat } from '@/types'

interface ChatPanelProps {
  pageId: string | null
  messages: PageChat[]
  onSendMessage: (message: string) => Promise<void>
  isGenerating: boolean
  streamingContent: string
}

const QUICK_PROMPTS = [
  {
    icon: Building2,
    label: 'Investment Memo',
    prompt: 'Create an offering memorandum for a property at ',
    color: 'text-blue',
    bg: 'bg-blue/10',
  },
  {
    icon: FileText,
    label: 'Tear Sheet',
    prompt: 'Create a one-page tear sheet summary for ',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: TrendingUp,
    label: 'Leasing Flyer',
    prompt: 'Create a leasing flyer for available space at ',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
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
    <div className="flex flex-col h-full bg-navy-950">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-navy-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue to-blue-hover flex items-center justify-center shadow-lg shadow-blue/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-white">PageLink AI</h2>
            <p className="text-xs text-navy-400">Create professional CRE documents</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue/20 to-blue-hover/20 flex items-center justify-center mb-5 shadow-lg shadow-blue/5">
              <Building2 className="w-8 h-8 text-blue" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">
              Create CRE Marketing Documents
            </h3>
            <p className="text-sm text-navy-400 mb-8 max-w-sm leading-relaxed">
              Describe what you want to create. Include a NYC address to auto-fetch property data from public records.
            </p>

            {/* Quick Prompts */}
            <div className="w-full max-w-md space-y-2.5">
              <p className="text-xs font-medium text-navy-500 uppercase tracking-wider mb-3">Quick Start</p>
              {QUICK_PROMPTS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="w-full flex items-center gap-3 p-3.5 bg-navy-900/50 hover:bg-navy-800/70 border border-navy-800/50 hover:border-navy-700 rounded-xl text-left transition-all duration-200 group"
                >
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                    <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-navy-200 group-hover:text-white transition-colors">{item.label}</span>
                    <p className="text-xs text-navy-500 truncate">{item.prompt}...</p>
                  </div>
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
              <div className="flex gap-3 animate-fade-in">
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue to-blue-hover rounded-xl flex items-center justify-center shadow-lg shadow-blue/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-navy-900/60 rounded-xl p-4 border border-navy-800/50">
                  <p className="text-sm text-navy-200 whitespace-pre-wrap leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-blue animate-pulse ml-1 rounded-sm" />
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isGenerating && !streamingContent && (
              <div className="flex gap-3 animate-fade-in">
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue to-blue-hover rounded-xl flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="flex-1 bg-navy-900/60 rounded-xl p-4 border border-navy-800/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-navy-800/50 bg-navy-900/30">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pageId ? "Describe changes or additions..." : "Describe the document you want to create..."}
            className="w-full bg-navy-900/80 border border-navy-700/50 rounded-xl px-4 py-3.5 pr-14 text-sm text-white placeholder-navy-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue/50 focus:border-blue/50 transition-all"
            rows={1}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2.5 bottom-2.5 p-2.5 bg-blue hover:bg-blue-hover disabled:bg-navy-700 disabled:text-navy-500 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue/20 disabled:shadow-none"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-navy-600 mt-2.5 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-navy-800/50 rounded text-navy-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-navy-800/50 rounded text-navy-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
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
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-navy-700'
            : 'bg-gradient-to-br from-blue to-blue-hover shadow-lg shadow-blue/20'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-semibold text-white">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`flex-1 rounded-xl p-4 ${
          isUser
            ? 'bg-blue/10 border border-blue/20'
            : 'bg-navy-900/60 border border-navy-800/50'
        }`}
      >
        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
          isUser ? 'text-navy-100' : 'text-navy-200'
        }`}>
          {message.content}
        </p>
        <p className="text-[10px] text-navy-600 mt-3 font-mono">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
