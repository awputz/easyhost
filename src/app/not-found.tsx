import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 icon */}
        <div className="w-20 h-20 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔍</span>
        </div>

        {/* Message */}
        <h1 className="font-serif text-6xl font-bold text-navy-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-navy-700 mb-2">
          Page not found
        </h2>
        <p className="text-navy-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-navy-800 text-cream-50 rounded-lg font-medium hover:bg-navy-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-white text-navy-700 border border-navy-200 rounded-lg font-medium hover:bg-navy-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Create document CTA */}
        <div className="mt-12 pt-8 border-t border-navy-100">
          <p className="text-sm text-navy-500 mb-4">
            Want to create something?
          </p>
          <Link
            href="/create"
            className="text-navy-700 hover:text-navy-900 font-medium transition-colors"
          >
            Create a new document &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
