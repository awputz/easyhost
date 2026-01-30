'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2, Code } from 'lucide-react'
import { toast } from 'sonner'

export default function PasteHTMLPage() {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [title, setTitle] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [creating, setCreating] = useState(false)

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
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/new"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="text-xl font-semibold bg-transparent border-none focus:outline-none placeholder-gray-300 w-64"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showPreview ? 'Hide' : 'Show'} preview
            </button>

            <button
              onClick={handleCreate}
              disabled={!html.trim() || creating}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {creating ? 'Creating...' : 'Create page'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className={`flex ${showPreview ? '' : 'justify-center'}`}>
        {/* Editor */}
        <div
          className={`${
            showPreview ? 'w-1/2 border-r border-gray-200' : 'w-full max-w-4xl'
          } h-[calc(100vh-73px)]`}
        >
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
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is my hosted page.</p>
</body>
</html>`}
            className="w-full h-full p-6 font-mono text-sm bg-white resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 h-[calc(100vh-73px)] bg-white">
            {html ? (
              <iframe
                srcDoc={html}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Preview will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
