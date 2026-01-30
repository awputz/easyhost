'use client'

import { useState } from 'react'
import {
  X,
  Code,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmbedSettingsProps {
  isOpen: boolean
  onClose: () => void
  documentSlug: string
  documentTitle: string
}

type EmbedSize = 'responsive' | 'fixed'
type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

const PREVIEW_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 800,
  tablet: 600,
  mobile: 350,
}

export function EmbedSettings({
  isOpen,
  onClose,
  documentSlug,
  documentTitle,
}: EmbedSettingsProps) {
  const [embedSize, setEmbedSize] = useState<EmbedSize>('responsive')
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [showBorder, setShowBorder] = useState(true)
  const [showBadge, setShowBadge] = useState(true)
  const [allowFullscreen, setAllowFullscreen] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  if (!isOpen) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const embedUrl = `${baseUrl}/embed/${documentSlug}${!showBadge ? '?badge=0' : ''}`

  // Generate iframe code
  const iframeCode = embedSize === 'responsive'
    ? `<iframe
  src="${embedUrl}"
  style="width: 100%; height: 100%; min-height: 500px; border: ${showBorder ? '1px solid #e5e7eb' : 'none'}; border-radius: 8px;"
  ${allowFullscreen ? 'allowfullscreen' : ''}
  loading="lazy"
  title="${documentTitle}"
></iframe>`
    : `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  style="border: ${showBorder ? '1px solid #e5e7eb' : 'none'}; border-radius: 8px;"
  ${allowFullscreen ? 'allowfullscreen' : ''}
  loading="lazy"
  title="${documentTitle}"
></iframe>`

  // Generate JavaScript widget code
  const scriptCode = `<div id="pagelink-embed-${documentSlug}"></div>
<script>
(function() {
  var container = document.getElementById('pagelink-embed-${documentSlug}');
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.style.width = '${embedSize === 'responsive' ? '100%' : width + 'px'}';
  iframe.style.height = '${embedSize === 'responsive' ? '100%' : height + 'px'}';
  iframe.style.minHeight = '500px';
  iframe.style.border = '${showBorder ? '1px solid #e5e7eb' : 'none'}';
  iframe.style.borderRadius = '8px';
  iframe.loading = 'lazy';
  iframe.title = '${documentTitle}';
  ${allowFullscreen ? "iframe.allowFullscreen = true;" : ''}
  container.appendChild(iframe);
})();
</script>`

  const handleCopyIframe = async () => {
    await navigator.clipboard.writeText(iframeCode)
    setCopiedIframe(true)
    setTimeout(() => setCopiedIframe(false), 2000)
  }

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(scriptCode)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Embed Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings */}
            <div className="space-y-6">
              {/* Size Options */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Size
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEmbedSize('responsive')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      embedSize === 'responsive'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Responsive</div>
                    <div className="text-xs mt-1 opacity-70">Fills container</div>
                  </button>
                  <button
                    onClick={() => setEmbedSize('fixed')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      embedSize === 'fixed'
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium">Fixed Size</div>
                    <div className="text-xs mt-1 opacity-70">Custom dimensions</div>
                  </button>
                </div>
              </div>

              {/* Fixed Size Inputs */}
              {embedSize === 'fixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Options
                </label>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <span className="text-sm text-white">Show border</span>
                  <button onClick={() => setShowBorder(!showBorder)}>
                    {showBorder ? (
                      <ToggleRight className="w-8 h-8 text-purple-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <span className="text-sm text-white">Show Pagelink badge</span>
                  <button onClick={() => setShowBadge(!showBadge)}>
                    {showBadge ? (
                      <ToggleRight className="w-8 h-8 text-purple-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <span className="text-sm text-white">Allow fullscreen</span>
                  <button onClick={() => setAllowFullscreen(!allowFullscreen)}>
                    {allowFullscreen ? (
                      <ToggleRight className="w-8 h-8 text-purple-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Code Blocks */}
              <div className="space-y-4">
                {/* Iframe Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">
                      Iframe Embed
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyIframe}
                      className="text-xs"
                    >
                      {copiedIframe ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto font-mono">
                    {iframeCode}
                  </pre>
                </div>

                {/* JavaScript Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">
                      JavaScript Widget
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyScript}
                      className="text-xs"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto font-mono">
                    {scriptCode}
                  </pre>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-zinc-300">Preview</label>
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-2 rounded transition-colors ${
                      previewDevice === 'tablet'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 h-[500px] flex items-center justify-center">
                <div
                  className="bg-white rounded-lg overflow-hidden transition-all duration-300"
                  style={{
                    width: embedSize === 'fixed' ? Math.min(width, PREVIEW_WIDTHS[previewDevice]) : PREVIEW_WIDTHS[previewDevice],
                    height: embedSize === 'fixed' ? Math.min(height, 450) : 450,
                    border: showBorder ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  <iframe
                    src={`${baseUrl}/${documentSlug}`}
                    className="w-full h-full"
                    title="Embed Preview"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <a
                  href={`${baseUrl}/${documentSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Open in new tab
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Embed this document on any website or blog
            </p>
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
