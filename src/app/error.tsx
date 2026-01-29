'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)

    // In production, you could send to an error tracking service
    // Example: Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        {/* Error message */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-zinc-400 mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 mb-1 font-mono">Error Details:</p>
            <p className="text-sm text-red-400 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-zinc-600 mt-2 font-mono">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-zinc-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to homepage
          </Button>
        </div>

        {/* Support link */}
        <p className="text-xs text-zinc-500 mt-8">
          If this problem persists, please{' '}
          <a
            href="mailto:support@pagelink.com"
            className="text-blue-400 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}
