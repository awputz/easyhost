import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Pagelink',
  description: 'Terms of Service for using Pagelink',
}

export default function TermsPage() {
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
        <h1 className="font-serif text-3xl font-semibold text-navy-900 mb-2">Terms of Service</h1>
        <p className="text-navy-400 mb-8">Last updated: January 2026</p>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-navy-600 mb-4">
              By accessing or using Pagelink (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">2. Description of Service</h2>
            <p className="text-navy-600 mb-4">
              Pagelink is an AI-powered document creation and hosting platform that allows users to create, edit, and share documents through unique URLs. The Service includes document generation, file hosting, analytics, and related features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">3. User Accounts</h2>
            <p className="text-navy-600 mb-4">
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">4. Acceptable Use</h2>
            <p className="text-navy-600 mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside text-navy-600 mb-4 space-y-2">
              <li>Upload or share illegal, harmful, or offensive content</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or engage in phishing</li>
              <li>Harass, threaten, or defame others</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Interfere with the Service&apos;s operation</li>
              <li>Use the Service for spam or unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">5. Content Ownership</h2>
            <p className="text-navy-600 mb-4">
              You retain ownership of content you create and upload. By using the Service, you grant us a limited license to store, display, and distribute your content as necessary to provide the Service. We do not claim ownership of your content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">6. AI-Generated Content</h2>
            <p className="text-navy-600 mb-4">
              Documents created using our AI features are generated based on your inputs. You are responsible for reviewing and ensuring the accuracy of AI-generated content before sharing. We do not guarantee the accuracy, completeness, or appropriateness of AI-generated content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">7. Payment and Billing</h2>
            <p className="text-navy-600 mb-4">
              Paid plans are billed in advance on a monthly or annual basis. Refunds are available within 30 days of initial purchase. You may cancel your subscription at any time, and access will continue until the end of the billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">8. Service Availability</h2>
            <p className="text-navy-600 mb-4">
              We strive to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features with reasonable notice. Scheduled maintenance will be communicated in advance when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-navy-600 mb-4">
              To the maximum extent permitted by law, Pagelink shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">10. Termination</h2>
            <p className="text-navy-600 mb-4">
              We may terminate or suspend your account for violations of these terms. Upon termination, your right to use the Service ceases immediately. You may export your data before termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">11. Changes to Terms</h2>
            <p className="text-navy-600 mb-4">
              We may update these terms from time to time. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">12. Contact</h2>
            <p className="text-navy-600 mb-4">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@pagelink.com" className="text-navy-800 hover:underline">
                legal@pagelink.com
              </a>
            </p>
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
