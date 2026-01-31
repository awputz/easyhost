'use client'

import { useState, useCallback, useEffect } from 'react'

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChatPanel } from '@/components/pagelink/chat-panel'
import { PreviewPanel } from '@/components/pagelink/preview-panel'
import { CRE_THEMES, getThemeSwatches } from '@/lib/cre-themes'
import { extractNYCAddress, fetchPLUTOData, type PropertyData } from '@/services/nyc-property'
import { PageChat, PageTheme } from '@/types'
import {
  ArrowLeft,
  Settings,
  Palette,
  FileText,
  Building2,
  Mic,
  MicOff,
  Loader2,
  Check,
  X,
} from 'lucide-react'

type DocumentType = 'offering_memorandum' | 'tear_sheet' | 'leasing_flyer' | 'one_pager'

const DOCUMENT_TYPES = [
  { id: 'offering_memorandum', name: 'Offering Memorandum', description: 'Full investment package' },
  { id: 'tear_sheet', name: 'Tear Sheet', description: 'One-page property summary' },
  { id: 'leasing_flyer', name: 'Leasing Flyer', description: 'Space availability' },
  { id: 'one_pager', name: 'One Pager', description: 'Quick overview' },
]

export default function CreatePage() {
  const router = useRouter()
  const [pageId, setPageId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [messages, setMessages] = useState<PageChat[]>([])
  const [html, setHtml] = useState('')
  const [title, setTitle] = useState('Untitled Document')
  const [theme, setTheme] = useState<PageTheme>('professional-dark')
  const [creTheme, setCreTheme] = useState('navy')
  const [documentType, setDocumentType] = useState<DocumentType>('offering_memorandum')
  const [isPublic, setIsPublic] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognitionConstructor) {
        const recognizer = new SpeechRecognitionConstructor()
        recognizer.continuous = false
        recognizer.interimResults = true
        recognizer.lang = 'en-US'
        setRecognition(recognizer)
      }
    }
  }, [])

  const handleSendMessage = useCallback(async (message: string) => {
    // Check for NYC address and fetch property data
    const addressMatch = extractNYCAddress(message)
    if (addressMatch && !propertyData) {
      setIsLoadingProperty(true)
      try {
        const data = await fetchPLUTOData(addressMatch.address, addressMatch.borough)
        if (data) {
          setPropertyData(data)
          // Add property context to message
          message = `${message}\n\n[Property data fetched: ${data.address}, ${data.borough} - ${data.buildingArea.toLocaleString()} SF, ${data.unitsTotal} units, built ${data.yearBuilt}]`
        }
      } catch (error) {
        console.error('Failed to fetch property data:', error)
      } finally {
        setIsLoadingProperty(false)
      }
    }

    // Add user message
    const userMessage: PageChat = {
      id: Date.now().toString(),
      page_id: pageId || 'draft',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/pagelink/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          documentId: slug,
          existingHtml: html,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          documentType,
          theme: creTheme,
          propertyData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullResponse = ''

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
              } else if (data.type === 'done') {
                setSlug(data.slug)
                // Extract HTML from response
                const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/)?.[1] ||
                                 fullResponse.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0]
                if (htmlMatch) {
                  setHtml(htmlMatch)
                  // Extract title
                  const titleMatch = htmlMatch.match(/<title>([^<]+)<\/title>/i)
                  if (titleMatch) setTitle(titleMatch[1])
                }
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: PageChat = {
        id: (Date.now() + 1).toString(),
        page_id: pageId || 'draft',
        role: 'assistant',
        content: fullResponse,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage: PageChat = {
        id: (Date.now() + 1).toString(),
        page_id: pageId || 'draft',
        role: 'assistant',
        content: 'Sorry, there was an error generating your document. Please try again.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
    }
  }, [messages, slug, html, documentType, creTheme, propertyData])

  const toggleVoiceInput = useCallback(() => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')

        if (event.results[0].isFinal) {
          handleSendMessage(transcript)
          setIsListening(false)
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      setIsListening(true)
    }
  }, [recognition, isListening, handleSendMessage])

  const themeSwatches = getThemeSwatches()

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            <span className="font-medium text-white">{title}</span>
            {slug && (
              <span className="text-xs text-zinc-500 font-mono">/{slug}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Property Data Indicator */}
          {isLoadingProperty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading property data...
            </div>
          )}
          {propertyData && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs">
              <Check className="w-3 h-3" />
              {propertyData.address}
            </div>
          )}

          {/* Voice Input */}
          {recognition && (
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-violet-500/20 text-violet-400'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-zinc-800 bg-zinc-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* Document Type */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                  <FileText className="w-4 h-4" />
                  Document Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DOCUMENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setDocumentType(type.id as DocumentType)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        documentType === type.id
                          ? 'bg-violet-500/20 border-violet-500 border text-white'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-zinc-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                  <Palette className="w-4 h-4" />
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {themeSwatches.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setCreTheme(t.id)}
                      className={`p-3 rounded-lg transition-all ${
                        creTheme === t.id
                          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900'
                          : 'hover:ring-1 hover:ring-zinc-600'
                      }`}
                      style={{ background: t.colors[2] }}
                    >
                      <div className="flex gap-1 mb-2">
                        {t.colors.slice(0, 2).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-medium" style={{ color: t.colors[0] }}>
                        {t.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-zinc-800">
          <ChatPanel
            pageId={pageId}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            streamingContent={streamingContent}
          />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2">
          <PreviewPanel
            html={html}
            theme={theme}
            title={title}
            slug={slug}
            isPublic={isPublic}
          />
        </div>
      </div>
    </div>
  )
}
