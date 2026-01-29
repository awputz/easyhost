'use client'

import { EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function PrivateDocument() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-zinc-800 rounded-2xl flex items-center justify-center">
            <EyeOff className="w-8 h-8 text-zinc-400" />
          </div>

          {/* Content */}
          <h1 className="text-xl font-semibold text-white mb-2">
            Private Document
          </h1>
          <p className="text-zinc-400 mb-6">
            This document is private and cannot be viewed publicly.
          </p>

          {/* Action */}
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Create Your Own
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Powered by Pagelink
          </a>
        </div>
      </div>
    </div>
  )
}
