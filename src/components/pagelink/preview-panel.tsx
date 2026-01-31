'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Maximize2,
  Minimize2,
  FileText,
  RotateCcw,
  Sparkles,
  Building2,
} from 'lucide-react'
import { getThemeCSS, wrapDocumentHTML, CRE_THEMES } from '@/lib/cre-themes'

type ViewMode = 'preview' | 'code'
type DeviceSize = 'desktop' | 'tablet' | 'mobile'

interface PreviewPanelProps {
  html: string
  creTheme: string
  title: string
  slug: string | null
  isPublic: boolean
  isGenerating?: boolean
  onToggleFullscreen?: () => void
}

const DEVICE_CONFIGS: Record<DeviceSize, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
}

// Sample CRE document for preview when empty
const SAMPLE_CRE_DOCUMENT = `
<div class="page" style="padding: 64px;">
  <div style="text-align: center; margin-bottom: 48px;">
    <span class="badge" style="margin-bottom: 16px;">Sample Preview</span>
    <h1 style="font-size: 2.5rem; margin-bottom: 8px;">146 West 28th Street</h1>
    <p style="color: var(--text-secondary); font-size: 1.1rem;">Chelsea, Manhattan</p>
  </div>

  <div class="grid grid-4" style="margin-bottom: 48px;">
    <div class="stat-box">
      <div class="stat-value">$12.5M</div>
      <div class="stat-label">Asking Price</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">5.07%</div>
      <div class="stat-label">Cap Rate</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">$634K</div>
      <div class="stat-label">NOI</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">16,000</div>
      <div class="stat-label">Square Feet</div>
    </div>
  </div>

  <div class="section-header">
    <h2>Investment Highlights</h2>
  </div>

  <div class="card">
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 12px 0; border-bottom: 1px solid var(--text-tertiary); opacity: 0.3; display: flex; align-items: center; gap: 12px;">
        <span style="color: var(--accent);">●</span>
        <span>Prime Chelsea location steps from High Line</span>
      </li>
      <li style="padding: 12px 0; border-bottom: 1px solid var(--text-tertiary); opacity: 0.3; display: flex; align-items: center; gap: 12px;">
        <span style="color: var(--accent);">●</span>
        <span>100% occupied with established tenants</span>
      </li>
      <li style="padding: 12px 0; display: flex; align-items: center; gap: 12px;">
        <span style="color: var(--accent);">●</span>
        <span>Significant upside potential on renewal</span>
      </li>
    </ul>
  </div>

  <p style="text-align: center; color: var(--text-tertiary); font-size: 0.875rem; margin-top: 48px;">
    This is a sample preview. Start chatting to generate your actual document.
  </p>
</div>
`

export function PreviewPanel({
  html,
  creTheme,
  title,
  slug,
  isPublic,
  isGenerating,
  onToggleFullscreen,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const publicUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}` : null

  // Generate the full HTML for the iframe
  const iframeContent = useMemo(() => {
    const contentToRender = showSample ? SAMPLE_CRE_DOCUMENT : html

    if (!contentToRender) return ''

    // If the HTML is already a complete document, use it directly
    if (contentToRender.includes('<!DOCTYPE') || contentToRender.includes('<html')) {
      return contentToRender
    }

    // Otherwise, wrap it with the CRE theme
    return wrapDocumentHTML(contentToRender, title, creTheme)
  }, [html, creTheme, title, showSample])

  // Reset sample mode when HTML is generated
  useEffect(() => {
    if (html) {
      setShowSample(false)
    }
  }, [html])

  const handleCopyLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyHtml = async () => {
    const contentToCopy = html || (showSample ? wrapDocumentHTML(SAMPLE_CRE_DOCUMENT, title, creTheme) : '')
    await navigator.clipboard.writeText(contentToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadHtml = () => {
    const contentToDownload = html || (showSample ? wrapDocumentHTML(SAMPLE_CRE_DOCUMENT, title, creTheme) : '')
    const blob = new Blob([contentToDownload], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    onToggleFullscreen?.()
  }

  const themeData = CRE_THEMES[creTheme] || CRE_THEMES.navy
  const hasContent = Boolean(html) || showSample

  return (
    <div className={`flex flex-col h-full bg-navy-900/50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Preview Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-navy-800/50 flex items-center justify-between bg-navy-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-navy-800/60 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === 'preview'
                  ? 'bg-blue text-white shadow-lg shadow-blue/20'
                  : 'text-navy-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === 'code'
                  ? 'bg-blue text-white shadow-lg shadow-blue/20'
                  : 'text-navy-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>

          {/* Device Size Toggle (only in preview mode) */}
          {viewMode === 'preview' && (
            <div className="flex items-center gap-0.5 ml-1 p-1 bg-navy-800/40 rounded-lg">
              {(Object.keys(DEVICE_CONFIGS) as DeviceSize[]).map((size) => {
                const Icon = size === 'desktop' ? Monitor : size === 'tablet' ? Tablet : Smartphone
                return (
                  <button
                    key={size}
                    onClick={() => setDeviceSize(size)}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      deviceSize === size
                        ? 'bg-navy-700 text-white shadow-sm'
                        : 'text-navy-500 hover:text-white hover:bg-navy-700/50'
                    }`}
                    title={DEVICE_CONFIGS[size].label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Theme indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-navy-800/40 rounded-lg">
            <div
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ background: themeData.primary }}
            />
            <span className="text-xs text-navy-400">{themeData.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          {hasContent && viewMode === 'preview' && (
            <button
              onClick={handleRefresh}
              className="p-1.5 text-navy-500 hover:text-white hover:bg-navy-700/50 rounded-md transition-all duration-200"
              title="Refresh preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Copy/Download Actions */}
          {viewMode === 'code' ? (
            <button
              onClick={handleCopyHtml}
              disabled={!hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownloadHtml}
                disabled={!hasContent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              {publicUrl && isPublic && (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue hover:bg-blue-hover rounded-lg text-xs font-medium text-white transition-all duration-200 shadow-lg shadow-blue/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                </>
              )}
            </>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-navy-500 hover:text-white hover:bg-navy-700/50 rounded-md transition-all duration-200"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden p-5 bg-navy-950">
        {viewMode === 'preview' ? (
          <div
            className="h-full mx-auto transition-all duration-300"
            style={{ maxWidth: DEVICE_CONFIGS[deviceSize].width }}
          >
            {hasContent ? (
              <div className="relative h-full">
                {/* Loading overlay when generating */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue to-blue-hover flex items-center justify-center animate-pulse">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm text-navy-300">Updating preview...</p>
                    </div>
                  </div>
                )}

                {/* Sample badge */}
                {showSample && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    Sample Preview
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  srcDoc={iframeContent}
                  className="w-full h-full bg-white rounded-xl shadow-2xl ring-1 ring-navy-700/50"
                  title="Document Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-navy-800/50 bg-navy-900/30">
                <div className="text-center px-8 max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-navy-800/80 to-navy-700/50 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-10 h-10 text-navy-500" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-navy-200 mb-3">
                    Document Preview
                  </h3>
                  <p className="text-navy-500 text-sm mb-6 leading-relaxed">
                    Your CRE marketing document will appear here. Start a conversation to generate investment memos, tear sheets, and more.
                  </p>
                  <button
                    onClick={() => setShowSample(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-800/60 hover:bg-navy-700 border border-navy-700/50 hover:border-navy-600 rounded-lg text-sm font-medium text-navy-300 hover:text-white transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Sample Document
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full overflow-auto rounded-xl bg-navy-900/60 border border-navy-800/50">
            <div className="flex items-center justify-between px-5 py-3 border-b border-navy-800/50">
              <span className="text-xs font-medium text-navy-400">HTML Source</span>
              {hasContent && (
                <span className="text-xs text-navy-600">
                  {(html || (showSample ? SAMPLE_CRE_DOCUMENT : '')).length.toLocaleString()} characters
                </span>
              )}
            </div>
            <pre className="p-5 text-xs text-navy-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {html || (showSample ? wrapDocumentHTML(SAMPLE_CRE_DOCUMENT, title, creTheme) : '<!-- No HTML content yet -->\n\n<!-- Start chatting to generate your document -->')}
            </pre>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {hasContent && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-navy-800/50 bg-navy-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-navy-500">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {showSample ? 'Sample' : 'Live Preview'}
            </span>
            <span>Theme: {themeData.name}</span>
          </div>
          {slug && (
            <span className="text-xs text-navy-600 font-mono">
              /p/{slug}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
