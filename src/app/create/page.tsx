'use client'

import Link from 'next/link'

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-navy-100 bg-white flex items-center px-4">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-navy-50 rounded-lg transition-colors text-navy-500"
        >
          &larr; Back to Dashboard
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-navy-100 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">✨</span>
          </div>

          <h1 className="font-serif text-3xl font-semibold text-navy-900 mb-4">
            AI Document Generator
          </h1>

          <div className="inline-block px-4 py-2 bg-blue-light text-blue rounded-full text-sm font-medium mb-6">
            Coming Soon
          </div>

          <p className="text-navy-600 mb-8 leading-relaxed">
            We&apos;re working on an AI-powered document generator that will help you create
            beautiful pitch decks, proposals, and reports in seconds. Stay tuned!
          </p>

          <div className="bg-white rounded-xl border border-navy-100 p-6 mb-8">
            <h2 className="font-medium text-navy-800 mb-4">In the meantime, you can:</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/files"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">📁</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Upload Files</div>
                  <div className="text-sm text-navy-500">Host and share your documents, images, and videos</div>
                </div>
              </Link>

              <Link
                href="/dashboard/collections"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">📚</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Create Collections</div>
                  <div className="text-sm text-navy-500">Organize files into shareable collections</div>
                </div>
              </Link>

              <Link
                href="/dashboard/links"
                className="flex items-center gap-3 p-3 rounded-lg bg-cream-50 hover:bg-cream-100 border border-navy-100 transition-colors"
              >
                <span className="text-xl">🔗</span>
                <div className="text-left">
                  <div className="font-medium text-navy-800">Create Short Links</div>
                  <div className="text-sm text-navy-500">Generate password-protected shareable links</div>
                </div>
              </Link>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
