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
import { ChatPanel } from '@/components/pagelink/chat-panel'
import { PreviewPanel } from '@/components/pagelink/preview-panel'
import { CRE_THEMES, getThemeSwatches } from '@/lib/cre-themes'
import { extractNYCAddress, fetchPLUTOData, type PropertyData } from '@/services/nyc-property'
import { PageChat } from '@/types'
import {
  ArrowLeft,
  Settings2,
  Palette,
  FileText,
  Building2,
  Mic,
  MicOff,
  Loader2,
  Check,
  MapPin,
  ChevronDown,
  X,
} from 'lucide-react'

type DocumentType = 'offering_memorandum' | 'tear_sheet' | 'leasing_flyer' | 'one_pager'

// Helper function to extract HTML from AI response
function extractHtmlFromResponse(response: string): string | null {
  // Try to extract from markdown code blocks first
  const codeBlockMatch = response.match(/```html\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to extract a complete HTML document
  const docMatch = response.match(/<!DOCTYPE html[\s\S]*?<\/html>/i)
  if (docMatch) {
    return docMatch[0].trim()
  }

  // Try to extract partial HTML that starts with <!DOCTYPE but might not have closing tag yet
  const partialDocMatch = response.match(/<!DOCTYPE html[\s\S]*/i)
  if (partialDocMatch && partialDocMatch[0].includes('<body')) {
    return partialDocMatch[0].trim()
  }

  // Try to find just an HTML document structure
  const htmlTagMatch = response.match(/<html[\s\S]*?<\/html>/i)
  if (htmlTagMatch) {
    return '<!DOCTYPE html>\n' + htmlTagMatch[0].trim()
  }

  return null
}

const DOCUMENT_TYPES = [
  {
    id: 'offering_memorandum',
    name: 'Offering Memorandum',
    description: 'Multi-page investment package',
    icon: '📊'
  },
  {
    id: 'tear_sheet',
    name: 'Tear Sheet',
    description: 'One-page property summary',
    icon: '📄'
  },
  {
    id: 'leasing_flyer',
    name: 'Leasing Flyer',
    description: 'Space availability marketing',
    icon: '🏢'
  },
  {
    id: 'one_pager',
    name: 'One Pager',
    description: 'Quick property overview',
    icon: '📋'
  },
]

export default function CreatePage() {
  const [pageId, setPageId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [messages, setMessages] = useState<PageChat[]>([])
  const [html, setHtml] = useState('')
  const [title, setTitle] = useState('Untitled Document')
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

                // Try to extract and show HTML in real-time for live preview
                const liveHtml = extractHtmlFromResponse(fullResponse)
                if (liveHtml) {
                  setHtml(liveHtml)
                }
              } else if (data.type === 'done') {
                setSlug(data.slug)
                // Final extraction with all content
                const finalHtml = extractHtmlFromResponse(fullResponse)
                if (finalHtml) {
                  setHtml(finalHtml)
                  const titleMatch = finalHtml.match(/<title>([^<]+)<\/title>/i)
                  if (titleMatch) setTitle(titleMatch[1])
                }
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch {
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
  }, [messages, slug, html, documentType, creTheme, propertyData, pageId])

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
    <div className="h-screen flex flex-col bg-navy-950">
      {/* Header */}
      <header className="h-16 border-b border-navy-800/50 bg-navy-900/80 backdrop-blur-sm flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-navy-800/50 rounded-lg transition-colors text-navy-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="h-8 w-px bg-navy-700/50" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue to-blue-hover flex items-center justify-center shadow-lg shadow-blue/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-medium text-white leading-tight">{title}</h1>
              {slug && (
                <p className="text-xs text-navy-400 font-mono">pagelink.co/p/{slug}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Data Badge */}
          {isLoadingProperty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue/10 border border-blue/20 text-blue rounded-lg text-xs font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching property data...</span>
            </div>
          )}
          {propertyData && !isLoadingProperty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[180px] truncate">{propertyData.address}</span>
              <button
                onClick={() => setPropertyData(null)}
                className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Voice Input */}
          {recognition && (
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30 animate-pulse'
                  : 'hover:bg-navy-800/50 text-navy-400 hover:text-white'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              showSettings
                ? 'bg-blue/20 text-blue ring-1 ring-blue/30'
                : 'bg-navy-800/50 hover:bg-navy-800 text-navy-300 hover:text-white'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-navy-800/50 bg-navy-900/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="grid grid-cols-2 gap-10">
              {/* Document Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy-200 mb-4">
                  <FileText className="w-4 h-4 text-blue" />
                  Document Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DOCUMENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setDocumentType(type.id as DocumentType)}
                      className={`relative group p-4 rounded-xl text-left transition-all duration-200 ${
                        documentType === type.id
                          ? 'bg-blue/15 border-2 border-blue shadow-lg shadow-blue/5'
                          : 'bg-navy-800/40 border-2 border-transparent hover:border-navy-600/50 hover:bg-navy-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{type.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${
                            documentType === type.id ? 'text-white' : 'text-navy-200 group-hover:text-white'
                          }`}>
                            {type.name}
                          </div>
                          <div className={`text-xs mt-1 ${
                            documentType === type.id ? 'text-blue' : 'text-navy-500'
                          }`}>
                            {type.description}
                          </div>
                        </div>
                      </div>
                      {documentType === type.id && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy-200 mb-4">
                  <Palette className="w-4 h-4 text-blue" />
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {themeSwatches.map(t => {
                    const themeData = CRE_THEMES[t.id]
                    return (
                      <button
                        key={t.id}
                        onClick={() => setCreTheme(t.id)}
                        className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
                          creTheme === t.id
                            ? 'ring-2 ring-blue ring-offset-2 ring-offset-navy-900 shadow-lg'
                            : 'hover:ring-1 hover:ring-navy-500'
                        }`}
                      >
                        {/* Theme preview */}
                        <div
                          className="p-4 pb-3"
                          style={{ background: themeData.background }}
                        >
                          {/* Color swatches */}
                          <div className="flex gap-1.5 mb-2.5">
                            <div
                              className="w-5 h-5 rounded-full shadow-sm border border-white/10"
                              style={{ background: themeData.primary }}
                            />
                            <div
                              className="w-5 h-5 rounded-full shadow-sm border border-white/10"
                              style={{ background: themeData.accent }}
                            />
                            <div
                              className="w-5 h-5 rounded-full shadow-sm border border-white/10"
                              style={{ background: themeData.primaryLight }}
                            />
                          </div>
                          {/* Theme name */}
                          <div
                            className="text-xs font-semibold"
                            style={{ color: themeData.text }}
                          >
                            {t.name}
                          </div>
                        </div>
                        {/* Selected indicator */}
                        {creTheme === t.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-navy-800/50">
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
            creTheme={creTheme}
            title={title}
            slug={slug}
            isPublic={isPublic}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  )
}
