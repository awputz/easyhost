import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold text-navy-900 tracking-tight">
            Pagelink
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-navy-600 hover:text-navy-900 transition-colors text-sm"
            >
              Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-100 py-4">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-navy-500">
          &copy; 2025 Pagelink. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
