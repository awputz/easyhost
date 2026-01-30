import Link from 'next/link'
import {
  Sparkles,
  Upload,
  Link2,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Code,
  FileText,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Link2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Pagelink</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Now with AI-powered page generation
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Host anything.
            <br />
            <span className="text-blue-500">Share with one link.</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload files, paste HTML, or let AI create pages for you. Get a
            shareable link in seconds. Track who views it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold text-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              Start hosting free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-semibold text-lg transition-colors flex items-center justify-center"
            >
              Try demo
            </Link>
          </div>

          <p className="mt-8 text-gray-400 text-sm">
            Free forever · No credit card required · 10K+ users
          </p>
        </div>
      </section>

      {/* What you can host */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Host anything you can imagine
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From simple files to complex pages, Pagelink handles it all
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Code, label: 'HTML pages', color: 'bg-blue-50 text-blue-600' },
              { icon: FileText, label: 'PDFs', color: 'bg-red-50 text-red-600' },
              { icon: Globe, label: 'Websites', color: 'bg-green-50 text-green-600' },
              { icon: Upload, label: 'Any file', color: 'bg-purple-50 text-purple-600' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-6 bg-white rounded-2xl border border-gray-100 text-center hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div
                  className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  <item.icon className="w-7 h-7" />
                </div>
                <p className="font-semibold text-gray-900">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Three steps. That's it.
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            If it takes longer than 10 seconds, we've failed
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload or create',
                description:
                  'Paste HTML, upload a file, import a URL, or let AI generate your page.',
              },
              {
                step: '2',
                title: 'Get your link',
                description:
                  'Instantly get a short, memorable link to share with anyone.',
              },
              {
                step: '3',
                title: 'Track views',
                description:
                  'See who is viewing your content with real-time analytics.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything you need
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI Generation',
                description:
                  'Describe what you want and watch it build instantly.',
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description:
                  'Pages load in milliseconds from our global CDN.',
              },
              {
                icon: Shield,
                title: 'Password Protection',
                description:
                  'Keep your content private with password-protected links.',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                description:
                  'Track views, locations, and engagement in real-time.',
              },
              {
                icon: Globe,
                title: 'Custom Domains',
                description:
                  'Use your own domain for a professional look.',
              },
              {
                icon: Link2,
                title: 'Short Links',
                description:
                  'Beautiful, memorable links that are easy to share.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-2xl border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-600 mb-12">Start free, upgrade when you need more</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200 text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-4">Perfect for getting started</p>
              <p className="text-4xl font-bold text-gray-900 mb-6">
                $0<span className="text-lg text-gray-500 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {['3 pages', '10MB per file', 'Basic analytics', 'Pagelink branding'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium text-center transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 bg-blue-500 rounded-2xl text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
              <p className="text-blue-100 mb-4">For professionals and teams</p>
              <p className="text-4xl font-bold text-white mb-6">
                $12<span className="text-lg text-blue-200 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited pages',
                  '100MB per file',
                  'Advanced analytics',
                  'Custom domains',
                  'Remove branding',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-xl font-medium text-center transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start hosting?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of creators who share with Pagelink
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-full font-semibold text-lg transition-colors"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Pagelink</span>
            </div>
            <div className="flex items-center gap-6 text-gray-600 text-sm">
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
              <span>© 2025 Pagelink</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
