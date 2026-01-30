'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Globe, AlertCircle, Check } from 'lucide-react'
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
          : 'Could not fetch that URL. Make sure it\'s a valid webpage.'
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
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* Back button */}
        <Link
          href="/new"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Import from URL
          </h1>
          <p className="text-gray-500">
            Enter any webpage URL and we'll host a copy for you
          </p>
        </div>

        {/* URL Input */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchURL()}
              placeholder="https://example.com/page"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchURL}
            disabled={!url || loading}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching...
              </>
            ) : (
              'Fetch'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <Check className="w-5 h-5" />
              <span className="font-medium">Page fetched successfully!</span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm text-gray-500 font-medium">
                Preview
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
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Host this page'
              )}
            </button>
          </div>
        )}

        {/* Info */}
        {!preview && !error && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                Enter the URL of any public webpage
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                We'll fetch and display a preview
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                Click "Host this page" to get your own shareable link
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
