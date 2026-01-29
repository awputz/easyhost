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
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Preview Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'code'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>

          {/* Device Size Toggle (only in preview mode) */}
          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setDeviceSize('desktop')}
                className={`p-1.5 rounded ${
                  deviceSize === 'desktop' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('tablet')}
                className={`p-1.5 rounded ${
                  deviceSize === 'tablet' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Tablet"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                className={`p-1.5 rounded ${
                  deviceSize === 'mobile' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white'
                }`}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy/Download Actions */}
          {viewMode === 'code' ? (
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy HTML
            </button>
          ) : (
            <>
              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>

              {publicUrl && isPublic && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Link
                </button>
              )}

              {publicUrl && isPublic && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs text-white transition-colors"
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
              className="p-1.5 text-zinc-500 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden p-4 bg-zinc-950">
        {viewMode === 'preview' ? (
          <div
            className="h-full mx-auto transition-all duration-300"
            style={{ maxWidth: DEVICE_WIDTHS[deviceSize] }}
          >
            {html ? (
              <iframe
                srcDoc={getFullHtml(html, theme, title)}
                className="w-full h-full bg-white rounded-lg shadow-2xl"
                title="Document Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-800">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Eye className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 text-sm">
                    Your document will appear here
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    Start chatting to generate content
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <pre className="p-4 bg-zinc-900 rounded-lg text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
              {html || '<!-- No HTML content yet -->'}
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
      .highlight { background: linear-gradient(90deg, #8b5cf6, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #8b5cf6; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #8b5cf6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
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
      .highlight { color: #7c3aed; font-weight: 600; }
      .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; }
      .metric { font-size: 2.5rem; font-weight: 700; color: #7c3aed; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      a { color: #7c3aed; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .cta { display: inline-block; background: #7c3aed; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; margin-top: 1rem; }
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
