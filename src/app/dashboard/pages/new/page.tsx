'use client'

import Link from 'next/link'

export default function NewPagePage() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-navy-100 bg-white flex items-center px-4">
        <Link
          href="/dashboard/pages"
          className="p-2 hover:bg-navy-50 rounded-lg transition-colors text-navy-500"
        >
          &larr; Back to Pages
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-navy-100 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">📄</span>
          </div>

          <h1 className="font-serif text-3xl font-semibold text-navy-900 mb-4">
            AI Page Generator
          </h1>

          <div className="inline-block px-4 py-2 bg-blue-light text-blue rounded-full text-sm font-medium mb-6">
            Coming Soon
          </div>

          <p className="text-navy-600 mb-8 leading-relaxed">
            The AI-powered page generator is coming soon. You&apos;ll be able to create
            beautiful landing pages, pitch decks, and documents using natural language.
          </p>

          <div className="bg-white rounded-xl border border-navy-100 p-6 mb-8">
            <h2 className="font-medium text-navy-800 mb-4">Available now:</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/files"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">📁</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Upload Files</div>
                  <div className="text-sm text-navy-500">Host PDFs, images, videos and more</div>
                </div>
              </Link>

              <Link
                href="/dashboard/collections"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">📚</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Create Collections</div>
                  <div className="text-sm text-navy-500">Bundle files for clients or projects</div>
                </div>
              </Link>

              <Link
                href="/dashboard/links"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">🔗</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Short Links</div>
                  <div className="text-sm text-navy-500">Create branded, trackable links</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/pages"
              className="px-6 py-3 border border-navy-200 hover:bg-navy-50 text-navy-700 rounded-lg font-medium transition-colors"
            >
              View Pages
            </Link>
            <Link
              href="/dashboard/files"
              className="px-6 py-3 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg font-medium transition-colors"
            >
              Upload Files
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
