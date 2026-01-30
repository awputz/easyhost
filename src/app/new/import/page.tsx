'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ImportURLPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchURL = async () => {
    if (!url) return

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch URL')
      }

      const data = await res.json()
      setPreview(data.html)
      setTitle(data.title || new URL(url).hostname)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not fetch that URL. Make sure it is a valid webpage.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!preview) return

    setCreating(true)
    try {
      const res = await fetch('/api/pagelink/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Imported Page',
          html: preview,
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
      <div className="max-w-2xl mx-auto py-12 px-6">
        {/* Back link */}
        <Link
          href="/new"
          className="inline-block text-sm text-navy-400 hover:text-navy-600 mb-10 transition-colors"
        >
          &larr; Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-2">
            Import from URL
          </h1>
          <p className="text-navy-500">
            Enter any webpage URL and we will host a copy for you
          </p>
        </div>

        {/* URL Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchURL()}
            placeholder="https://example.com/page"
            className="flex-1 px-4 py-3 bg-white border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-200 transition-all"
          />
          <button
            onClick={fetchURL}
            disabled={!url || loading}
            className="px-6 py-3 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 disabled:cursor-not-allowed text-cream-50 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            <p className="text-green-600 text-sm font-medium">
              Page fetched successfully
            </p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="w-full px-4 py-3 bg-white border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-200"
            />

            <div className="bg-white rounded-lg border border-navy-100 overflow-hidden">
              <div className="p-4 border-b border-navy-100">
                <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">Preview</span>
              </div>
              <iframe
                srcDoc={preview}
                className="w-full h-[400px] border-0"
                sandbox="allow-scripts"
                title="Preview"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 bg-navy-800 hover:bg-navy-700 disabled:bg-navy-200 text-cream-50 rounded-lg font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Host this page'}
            </button>
          </div>
        )}

        {/* Info */}
        {!preview && !error && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-navy-100">
            <h3 className="font-medium text-navy-900 mb-3">How it works</h3>
            <ol className="space-y-2 text-navy-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="font-mono text-xs text-navy-400">01</span>
                Enter the URL of any public webpage
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-xs text-navy-400">02</span>
                We will fetch and display a preview
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-xs text-navy-400">03</span>
                Click &quot;Host this page&quot; to get your own shareable link
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
