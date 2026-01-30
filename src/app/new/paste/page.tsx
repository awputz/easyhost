'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PasteHTMLPage() {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [title, setTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show preview by default on desktop
  useEffect(() => {
    if (!isMobile) {
      setShowPreview(true)
    }
  }, [isMobile])

  const handleCreate = async () => {
    if (!html.trim()) {
      toast.error('Please paste some HTML content')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/pagelink/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Page',
          html,
          documentType: 'custom',
          isPublic: true,
        }),
      })

      if (!res.ok) throw new Error('Failed to create page')

      const data = await res.json()
      toast.success('Page created!')
      router.push(`/d/${data.slug}`)
    } catch (error) {
      console.error('Error creating page:', error)
      toast.error('Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-navy-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link
              href="/new"
              className="text-sm text-navy-400 hover:text-navy-600 transition-colors flex-shrink-0"
            >
              &larr;
            </Link>
            <div className="w-px h-6 bg-navy-100 hidden md:block" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="font-serif text-lg md:text-xl font-medium bg-transparent border-none focus:outline-none placeholder-navy-300 text-navy-900 min-w-0 flex-1"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-xs md:text-sm text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-md transition-colors"
            >
              {showPreview ? 'Editor' : 'Preview'}
            </button>

            <button
              onClick={handleCreate}
              disabled={!html.trim() || creating}
              className="px-4 md:px-5 py-2 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 disabled:cursor-not-allowed text-cream-50 rounded-lg text-sm font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content - responsive */}
      <div className="flex flex-col md:flex-row">
        {/* Editor - full width on mobile when preview hidden, half on desktop */}
        <div
          className={`${
            isMobile
              ? showPreview ? 'hidden' : 'w-full'
              : showPreview ? 'w-1/2 border-r border-navy-100' : 'w-full'
          } h-[calc(100vh-65px)]`}
        >
          <div className="p-4 border-b border-navy-100 bg-white">
            <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">Editor</span>
          </div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={`Paste your HTML here...

<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    body { font-family: system-ui; padding: 40px; }
    h1 { color: #1e3a5f; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is my hosted page.</p>
</body>
</html>`}
            className="w-full h-[calc(100%-49px)] p-4 md:p-6 font-mono text-sm bg-white text-navy-800 resize-none focus:outline-none placeholder-navy-300"
            spellCheck={false}
          />
        </div>

        {/* Preview - full width on mobile when shown, half on desktop */}
        {showPreview && (
          <div className={`${isMobile ? 'w-full' : 'w-1/2'} h-[calc(100vh-65px)] bg-white`}>
            <div className="p-4 border-b border-navy-100">
              <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">Preview</span>
            </div>
            {html ? (
              <iframe
                srcDoc={html}
                className="w-full h-[calc(100%-49px)] border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[calc(100%-49px)] text-navy-400">
                <p className="text-sm">Preview will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
