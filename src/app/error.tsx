'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>

        {/* Error message */}
        <h1 className="font-serif text-2xl font-semibold text-navy-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-navy-500 mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white border border-navy-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-navy-400 mb-1 font-mono">Error Details:</p>
            <p className="text-sm text-red-600 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-navy-400 mt-2 font-mono">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-navy-800 text-cream-50 rounded-lg font-medium hover:bg-navy-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-white text-navy-700 border border-navy-200 rounded-lg font-medium hover:bg-navy-50 transition-colors"
          >
            Go to homepage
          </button>
        </div>

        {/* Support link */}
        <p className="text-xs text-navy-400 mt-8">
          If this problem persists, please{' '}
          <a
            href="mailto:support@pagelink.com"
            className="text-navy-700 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}
