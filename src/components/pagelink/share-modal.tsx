'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  Link2,
  Mail,
  QrCode,
  Code,
  Download,
  Twitter,
  Linkedin,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  documentSlug: string
  documentTitle: string
  documentHtml?: string
  documentId?: string
}

type ShareTab = 'link' | 'embed' | 'export'

export function ShareModal({
  isOpen,
  onClose,
  documentSlug,
  documentTitle,
  documentHtml,
  documentId,
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('link')
  const [copied, setCopied] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${documentSlug}`
    : `https://pagelink.com/${documentSlug}`

  useEffect(() => {
    if (isOpen) {
      // Generate QR code using a free QR code API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`
      setQrCodeUrl(qrUrl)
    }
  }, [isOpen, publicUrl])

  if (!isOpen) return null

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(documentTitle)
    const body = encodeURIComponent(`Check out this document: ${publicUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${documentTitle} ${publicUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(publicUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  const handleDownloadHtml = () => {
    if (!documentHtml) return
    const blob = new Blob([documentHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentSlug}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    if (!documentHtml || !documentId) return

    setIsExportingPdf(true)
    setPdfError(null)

    try {
      const response = await fetch(`/api/pagelink/documents/${documentId}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: documentHtml,
          title: documentTitle,
          format: 'A4',
          orientation: 'portrait',
          printBackground: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${documentSlug}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF export error:', error)
      setPdfError(error instanceof Error ? error.message : 'Failed to generate PDF')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>`

  const embedCodeResponsive = `<div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
  <iframe src="${publicUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px;" allowfullscreen></iframe>
</div>`

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Share Document</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'link', label: 'Share Link', icon: Link2 },
            { id: 'embed', label: 'Embed', icon: Code },
            { id: 'export', label: 'Export', icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ShareTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-6">
              {/* Link Copy */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Public Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(publicUrl, 'link')}
                    className="border-zinc-700"
                  >
                    {copied === 'link' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  QR Code
                </label>
                <div className="bg-white p-4 rounded-lg inline-block">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={150}
                      height={150}
                      className="block"
                    />
                  ) : (
                    <div className="w-[150px] h-[150px] flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Scan to open on mobile
                </p>
              </div>

              {/* Social Sharing */}
              <div>
                <label className="block text-sm text-zinc-400 mb-3">
                  Share via
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleEmailShare}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={handleLinkedInShare}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-6">
              {/* Fixed Size Embed */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Fixed Size Embed
                </label>
                <div className="relative">
                  <textarea
                    value={embedCode}
                    readOnly
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono resize-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCode, 'embed-fixed')}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                  >
                    {copied === 'embed-fixed' ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Responsive Embed */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Responsive Embed
                </label>
                <div className="relative">
                  <textarea
                    value={embedCodeResponsive}
                    readOnly
                    rows={5}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono resize-none"
                  />
                  <button
                    onClick={() => handleCopy(embedCodeResponsive, 'embed-responsive')}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                  >
                    {copied === 'embed-responsive' ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Maintains 4:3 aspect ratio and fills container width
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Preview
                </label>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="aspect-video bg-zinc-950 rounded-lg flex items-center justify-center">
                    <span className="text-zinc-600 text-sm">Embed Preview</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* PDF Error */}
              {pdfError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {pdfError}
                </div>
              )}

              {/* PDF Download */}
              <button
                onClick={handleDownloadPdf}
                disabled={!documentHtml || !documentId || isExportingPdf}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  {isExportingPdf ? (
                    <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
                  </div>
                  <div className="text-sm text-zinc-500">
                    High-quality PDF with preserved styling
                  </div>
                </div>
                <Download className="w-5 h-5 text-zinc-500" />
              </button>

              {/* HTML Download */}
              <button
                onClick={handleDownloadHtml}
                disabled={!documentHtml}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Download HTML</div>
                  <div className="text-sm text-zinc-500">
                    Self-contained HTML file with all styles
                  </div>
                </div>
                <Download className="w-5 h-5 text-zinc-500" />
              </button>

              {/* Open in New Tab */}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Open in Browser</div>
                  <div className="text-sm text-zinc-500">
                    View the live document in a new tab
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-zinc-500" />
              </a>

              {/* Print Option */}
              <button
                onClick={() => {
                  const win = window.open(publicUrl, '_blank')
                  if (win) {
                    win.onload = () => win.print()
                  }
                }}
                className="w-full flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Print / Save as PDF</div>
                  <div className="text-sm text-zinc-500">
                    Use browser&apos;s print dialog to save as PDF
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
