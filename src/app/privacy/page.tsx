import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Pagelink',
  description: 'Privacy Policy for Pagelink',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
              <span className="text-cream-50 font-bold text-sm">P</span>
            </div>
            <span className="font-serif font-semibold text-lg text-navy-900">Pagelink</span>
          </Link>
          <Link href="/" className="text-sm text-navy-500 hover:text-navy-700 transition-colors">
            &larr; Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-navy-900 mb-2">Privacy Policy</h1>
        <p className="text-navy-400 mb-8">Last updated: January 2026</p>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">1. Introduction</h2>
            <p className="text-navy-600 mb-4">
              Pagelink (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-navy-800 mb-2">Information You Provide</h3>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Account information (email, name, password)</li>
              <li>Content you create and upload (documents, files)</li>
              <li>Payment information (processed by Stripe)</li>
              <li>Communications with us (support requests, feedback)</li>
            </ul>

            <h3 className="text-lg font-medium text-navy-800 mb-2">Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Usage data (pages visited, features used)</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-navy-600 mb-4">We use collected information to:</p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process transactions and send billing information</li>
              <li>Send service-related communications</li>
              <li>Improve and personalize your experience</li>
              <li>Analyze usage patterns and trends</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">4. AI Processing</h2>
            <p className="text-navy-600 mb-4">
              When you use our AI document creation features, your prompts and inputs are processed by third-party AI providers (such as Anthropic) to generate content. These providers may process your inputs according to their own privacy policies. We do not use your content to train AI models.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">5. Information Sharing</h2>
            <p className="text-navy-600 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li><strong className="text-navy-700">Service providers:</strong> Companies that help us operate (hosting, payment processing, analytics)</li>
              <li><strong className="text-navy-700">Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong className="text-navy-700">Business transfers:</strong> In connection with a merger or acquisition</li>
              <li><strong className="text-navy-700">With your consent:</strong> When you explicitly agree to sharing</li>
            </ul>
            <p className="text-navy-600">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">6. Data Security</h2>
            <p className="text-navy-600 mb-4">
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Encryption in transit (TLS/SSL)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">7. Data Retention</h2>
            <p className="text-navy-600 mb-4">
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, or legitimate business purposes for up to 90 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">8. Your Rights</h2>
            <p className="text-navy-600 mb-4">Depending on your location, you may have rights to:</p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your information</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Restrict or object to processing</li>
            </ul>
            <p className="text-navy-600">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@pagelink.com" className="text-navy-800 hover:underline">
                privacy@pagelink.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">9. Cookies</h2>
            <p className="text-navy-600 mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li><strong className="text-navy-700">Essential cookies:</strong> Required for the Service to function</li>
              <li><strong className="text-navy-700">Analytics cookies:</strong> Help us understand how you use the Service</li>
              <li><strong className="text-navy-700">Preference cookies:</strong> Remember your settings</li>
            </ul>
            <p className="text-navy-600">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-navy-600 mb-4">
              The Service is not intended for children under 13. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">11. International Transfers</h2>
            <p className="text-navy-600 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in accordance with applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-navy-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">13. Contact Us</h2>
            <p className="text-navy-600 mb-4">
              For questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <ul className="list-none text-navy-600 space-y-1">
              <li>Email: <a href="mailto:privacy@pagelink.com" className="text-navy-800 hover:underline">privacy@pagelink.com</a></li>
              <li>Pagelink</li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-100 py-8 mt-12 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-navy-400">
          <p>&copy; {new Date().getFullYear()} Pagelink. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/terms" className="hover:text-navy-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-navy-700 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
