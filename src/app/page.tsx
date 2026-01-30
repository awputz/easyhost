import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-cream-50/80 backdrop-blur-lg border-b border-navy-100 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold text-navy-900 tracking-tight">
            Pagelink
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-navy-600 hover:text-navy-900 transition-colors hidden sm:block text-sm"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-navy-600 hover:text-navy-900 transition-colors text-sm"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg text-sm font-medium transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-navy-400 uppercase tracking-wider mb-6">
            Simple hosting for everyone
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-navy-900 mb-6 leading-tight tracking-tight">
            Host anything.
            <br />
            Share with one link.
          </h1>

          <p className="text-xl text-navy-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Upload files, create collections, and share with custom links.
            Simple hosting for documents, images, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-navy-800 hover:bg-navy-700 text-cream-50 rounded-lg font-medium transition-colors"
            >
              Start hosting free &rarr;
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white hover:bg-navy-50 text-navy-800 rounded-lg font-medium transition-colors border border-navy-100"
            >
              Try demo
            </Link>
          </div>

          <p className="mt-10 text-navy-400 text-sm">
            Free forever &middot; No credit card required
          </p>
        </div>
      </section>

      {/* What you can host */}
      <section className="py-20 px-6 border-t border-navy-100">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-navy-400 uppercase tracking-wider text-center mb-4">
            Capabilities
          </p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 text-center mb-12">
            Host anything you can imagine
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'HTML', desc: 'Web pages' },
              { label: 'PDF', desc: 'Documents' },
              { label: 'IMG', desc: 'Images' },
              { label: 'FILE', desc: 'Any file' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-6 bg-white rounded-lg border border-navy-100 text-center hover:border-navy-200 hover:shadow-sm transition-all"
              >
                <span className="font-mono text-xs text-navy-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <p className="font-medium text-navy-900 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-navy-100">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-navy-400 uppercase tracking-wider text-center mb-4">
            Process
          </p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 text-center mb-12">
            Three steps. That is it.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload or create',
                description: 'Upload files, create collections, or paste HTML directly.',
              },
              {
                step: '02',
                title: 'Get your link',
                description: 'Instantly get a short, memorable link to share with anyone.',
              },
              {
                step: '03',
                title: 'Track views',
                description: 'See who is viewing your content with real-time analytics.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="font-mono text-xs text-navy-400">{item.step}</span>
                <h3 className="text-lg font-medium text-navy-900 mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-navy-500 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-navy-100">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-navy-400 uppercase tracking-wider text-center mb-4">
            Features
          </p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 text-center mb-12">
            Everything you need
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Generation',
                description: 'Coming soon — describe what you want and watch it build.',
              },
              {
                title: 'Lightning Fast',
                description: 'Pages load in milliseconds from our global CDN.',
              },
              {
                title: 'Password Protection',
                description: 'Keep your content private with password-protected links.',
              },
              {
                title: 'Analytics',
                description: 'Track views, locations, and engagement in real-time.',
              },
              {
                title: 'Custom Domains',
                description: 'Use your own domain for a professional look.',
              },
              {
                title: 'Short Links',
                description: 'Beautiful, memorable links that are easy to share.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-lg border border-navy-100"
              >
                <h3 className="font-medium text-navy-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-navy-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 border-t border-navy-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-navy-400 uppercase tracking-wider mb-4">
            Pricing
          </p>
          <h2 className="font-serif text-3xl font-semibold text-navy-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-navy-500 mb-12">Start free, upgrade when you need more</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="p-8 bg-white rounded-xl border border-navy-100 text-left">
              <h3 className="font-medium text-navy-900 mb-1">Free</h3>
              <p className="text-navy-500 text-sm mb-4">Perfect for getting started</p>
              <p className="text-3xl font-serif font-semibold text-navy-900 mb-6">
                $0<span className="text-base text-navy-400 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-navy-600">
                {['3 pages', '10MB per file', 'Basic analytics', 'Pagelink branding'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-green-600">&#10003;</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 bg-navy-50 hover:bg-navy-100 text-navy-900 rounded-lg font-medium text-center transition-colors text-sm"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 bg-navy-800 rounded-xl text-left relative">
              <div className="absolute top-4 right-4 px-3 py-1 bg-navy-700 rounded text-cream-100 text-xs font-medium">
                Popular
              </div>
              <h3 className="font-medium text-cream-50 mb-1">Pro</h3>
              <p className="text-navy-300 text-sm mb-4">For professionals and teams</p>
              <p className="text-3xl font-serif font-semibold text-cream-50 mb-6">
                $12<span className="text-base text-navy-300 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8 text-sm text-cream-100">
                {[
                  'Unlimited pages',
                  '100MB per file',
                  'Advanced analytics',
                  'Custom domains',
                  'Remove branding',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-cream-200">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full py-3 bg-cream-50 hover:bg-white text-navy-900 rounded-lg font-medium text-center transition-colors text-sm"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-navy-100 bg-navy-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-cream-50 mb-4">
            Ready to start hosting?
          </h2>
          <p className="text-navy-300 mb-8">
            Join thousands of creators who share with Pagelink
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-cream-50 hover:bg-white text-navy-900 rounded-lg font-medium transition-colors"
          >
            Get started free &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-navy-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-serif text-lg font-semibold text-navy-900">Pagelink</span>
            <div className="flex items-center gap-6 text-navy-500 text-sm">
              <Link href="/terms" className="hover:text-navy-700 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-navy-700 transition-colors">
                Privacy
              </Link>
              <span>&copy; 2025 Pagelink</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
