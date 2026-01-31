'use client'

import { useState } from 'react'
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
  FileText,
} from 'lucide-react'
import { PageTheme } from '@/types'

type ViewMode = 'preview' | 'code'
type DeviceSize = 'desktop' | 'tablet' | 'mobile'

interface PreviewPanelProps {
  html: string
  theme: PageTheme
  title: string
  slug: string | null
  isPublic: boolean
  onToggleFullscreen?: () => void
}

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export function PreviewPanel({
  html,
  theme,
  title,
  slug,
  isPublic,
  onToggleFullscreen,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop')
  const [copied, setCopied] = useState(false)

  const publicUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}` : null

  const handleCopyLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadHtml = () => {
    const blob = new Blob([getFullHtml(html, theme, title)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-navy-900/50">
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
              {[
                { size: 'desktop' as DeviceSize, icon: Monitor },
                { size: 'tablet' as DeviceSize, icon: Tablet },
                { size: 'mobile' as DeviceSize, icon: Smartphone },
              ].map(({ size, icon: Icon }) => (
                <button
                  key={size}
                  onClick={() => setDeviceSize(size)}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    deviceSize === size
                      ? 'bg-navy-700 text-white shadow-sm'
                      : 'text-navy-500 hover:text-white hover:bg-navy-700/50'
                  }`}
                  title={size.charAt(0).toUpperCase() + size.slice(1)}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy/Download Actions */}
          {viewMode === 'code' ? (
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              {publicUrl && isPublic && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800/60 hover:bg-navy-700 rounded-lg text-xs font-medium text-navy-300 hover:text-white transition-all duration-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              )}

              {publicUrl && isPublic && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue hover:bg-blue-hover rounded-lg text-xs font-medium text-white transition-all duration-200 shadow-lg shadow-blue/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              )}
            </>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 text-navy-500 hover:text-white hover:bg-navy-700/50 rounded-md transition-all duration-200"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden p-5 bg-navy-950">
        {viewMode === 'preview' ? (
          <div
            className="h-full mx-auto transition-all duration-300"
            style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
          >
            {html ? (
              <iframe
                srcDoc={getFullHtml(html, theme, title)}
                className="w-full h-full bg-white rounded-xl shadow-2xl ring-1 ring-navy-700/50"
                title="Document Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-navy-800/50 bg-navy-900/30">
                <div className="text-center px-8">
                  <div className="w-16 h-16 mx-auto mb-5 bg-navy-800/50 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-navy-600" />
                  </div>
                  <h3 className="font-display text-lg font-medium text-navy-300 mb-2">
                    Your document preview
                  </h3>
                  <p className="text-navy-500 text-sm max-w-xs">
                    Start chatting to generate your CRE marketing document. It will appear here in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full overflow-auto rounded-xl bg-navy-900/60 border border-navy-800/50">
            <pre className="p-5 text-xs text-navy-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {html || '<!-- No HTML content yet -->\n\n<!-- Start chatting to generate your document -->'}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function getFullHtml(content: string, theme: PageTheme, title: string): string {
  const themeStyles = getThemeStyles(theme)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${themeStyles}
  </style>
</head>
<body>
  ${content}
</body>
</html>`
}

function getThemeStyles(theme: PageTheme): string {
  const themes: Record<PageTheme, string> = {
    'professional-dark': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
        color: #e5e5e5;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #fff; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #fff; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #f5f5f5; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { background: linear-gradient(90deg, #3b82f6, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #3b82f6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #3b82f6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'clean-light': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #374151;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111827; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #1f2937; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #374151; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { color: #3b82f6; font-weight: 600; }
      .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #3b82f6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #3b82f6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'corporate-blue': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        color: #cbd5e1;
        line-height: 1.7;
        padding: 3rem;
        min-height: 100vh;
      }
      h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #f1f5f9; }
      h2 { font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1rem; color: #e2e8f0; }
      h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #cbd5e1; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      .highlight { color: #3b82f6; font-weight: 600; }
      .card { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #3b82f6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #60a5fa; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
    `,
    'modern-minimal': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #fafafa;
        color: #525252;
        line-height: 1.8;
        padding: 4rem 3rem;
        min-height: 100vh;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 { font-size: 2rem; font-weight: 600; margin-bottom: 2rem; color: #171717; letter-spacing: -0.025em; }
      h2 { font-size: 1.5rem; font-weight: 600; margin: 3rem 0 1rem; color: #262626; }
      h3 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #404040; }
      p { margin-bottom: 1.25rem; }
      ul, ol { margin: 1.25rem 0; padding-left: 1.5rem; }
      li { margin-bottom: 0.75rem; }
      .highlight { color: #171717; font-weight: 600; }
      .card { background: white; border: 1px solid #e5e5e5; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2rem; font-weight: 600; color: #171717; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #171717; text-decoration: underline; text-underline-offset: 2px; }
      .cta { display: inline-block; background: #171717; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; text-decoration: none; }
    `,
    'custom': `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #333;
        line-height: 1.6;
        padding: 2rem;
      }
      h1 { font-size: 2rem; margin-bottom: 1rem; }
      h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
      p { margin-bottom: 1rem; }
      ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
    `,
  }

  return themes[theme] || themes['professional-dark']
}
