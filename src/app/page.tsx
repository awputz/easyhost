'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { GlowBackground } from '@/components/ui/glow-background'

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const router = useRouter()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  const handleSubmit = () => {
    if (!prompt.trim()) return
    sessionStorage.setItem('pagelink_initial_prompt', prompt)
    router.push('/create')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <GlowBackground />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-black" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Pagelink</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
              <Link href="#features" className="hover:text-white transition-colors duration-300">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-white transition-colors duration-300">
                Pricing
              </Link>
              <Link href="/templates" className="hover:text-white transition-colors duration-300">
                Templates
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-300"
              >
                Log in
              </button>
              <MagneticButton
                onClick={() => router.push('/signup')}
                className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-colors duration-300"
              >
                Get Started
              </MagneticButton>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="max-w-5xl mx-auto text-center pt-20">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-8"
          >
            {/* Overline */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-overline text-white/40"
            >
              The future of document sharing
            </motion.p>

            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-display"
            >
              Don't send files.
              <br />
              <span className="text-white/40">Send Pagelinks.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-body-lg text-white/50 max-w-2xl mx-auto"
            >
              Create beautiful documents with AI. Host any file.
              Share with a single link. Track everything.
            </motion.p>

            {/* Chat Input */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto pt-4"
            >
              <div className="relative group">
                {/* Glow effect behind input */}
                <div className="absolute -inset-1 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="What do you want to create?"
                    className="w-full h-36 p-6 pr-16 rounded-2xl bg-white/[0.03] border border-white/10
                             focus:border-white/20 focus:bg-white/[0.05] focus:outline-none
                             resize-none text-lg placeholder:text-white/25
                             transition-all duration-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                  />
                  <MagneticButton
                    onClick={handleSubmit}
                    className="absolute bottom-5 right-5 w-12 h-12 rounded-xl bg-white text-black
                             flex items-center justify-center hover:bg-white/90
                             transition-colors duration-300 disabled:opacity-30"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                </div>
              </div>

              {/* Example Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Pitch Deck', 'Investment Memo', 'Proposal', 'One-Pager'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(`Create a ${example.toLowerCase()} for my project`)}
                    className="px-4 py-2 text-sm text-white/40 hover:text-white/80
                             bg-white/[0.02] hover:bg-white/[0.05]
                             border border-white/5 hover:border-white/10
                             rounded-full transition-all duration-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Trust indicator */}
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-white/30 pt-4"
            >
              No signup required · Free forever plan
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Pricing */}
      <PricingSection />

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}

// Features Section Component
function FeaturesSection() {
  const features = [
    {
      title: 'AI Document Creation',
      description: 'Describe what you need. AI builds beautiful, professional documents in seconds.',
    },
    {
      title: 'Universal Hosting',
      description: 'Host any file type with permanent, reliable URLs. Images, videos, HTML, PDFs—everything.',
    },
    {
      title: 'Smart Links',
      description: 'Custom slugs, password protection, expiration dates. Full control over who sees what.',
    },
    {
      title: 'Deal Rooms',
      description: 'Group files into branded portals. Perfect for client presentations and investor materials.',
    },
    {
      title: 'Image Transforms',
      description: 'Resize, crop, convert formats via URL parameters. No extra tools needed.',
    },
    {
      title: 'Analytics',
      description: 'Track views, downloads, geography. Know exactly who engages with your content.',
    },
  ]

  return (
    <section id="features" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-headline mb-4">
            Everything you need
          </h2>
          <p className="text-body-lg text-white/50 max-w-xl mx-auto">
            From AI creation to analytics—one platform for all your document needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5
                       hover:border-white/10 hover:bg-white/[0.03]
                       transition-all duration-500"
            >
              <h3 className="text-xl font-semibold mb-3 group-hover:text-white transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-white/50 group-hover:text-white/60 transition-colors duration-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    { number: '01', title: 'Create', description: 'Describe what you need or upload files' },
    { number: '02', title: 'Host', description: 'Every file gets a permanent URL' },
    { number: '03', title: 'Share', description: 'Send one link with full control' },
    { number: '04', title: 'Track', description: 'Know who views and when' },
  ]

  return (
    <section className="py-32 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-headline text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          How it works
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-white/10 mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-white/50">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function PricingSection() {
  const router = useRouter()

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'For getting started',
      features: ['3 AI documents/month', '1GB storage', '10GB bandwidth', 'Basic analytics'],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$15',
      period: '/mo',
      description: 'For professionals',
      features: ['Unlimited AI documents', '50GB storage', '200GB bandwidth', 'Full analytics', 'Custom subdomain', 'Remove branding'],
      cta: 'Start Pro',
      highlighted: true,
    },
    {
      name: 'Business',
      price: '$49',
      period: '/mo',
      description: 'For teams',
      features: ['Everything in Pro', '250GB storage', '1TB bandwidth', 'Team collaboration', 'Custom domain', 'API access'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-32 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-headline mb-4">Simple pricing</h2>
          <p className="text-body-lg text-white/50">Start free. Upgrade when you need more.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                tier.highlighted
                  ? 'bg-white/[0.05] border-white/20'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-medium rounded-full">
                  Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-sm text-white/50">{tier.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-white/50">{tier.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <MagneticButton
                onClick={() => router.push('/signup')}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                  tier.highlighted
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                {tier.cta}
              </MagneticButton>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const router = useRouter()

  return (
    <section className="py-32 px-6 border-t border-white/5">
      <motion.div
        className="max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-headline mb-6">
          Ready to stop sending files?
        </h2>
        <p className="text-body-lg text-white/50 mb-10">
          Create your first Pagelink in seconds. No credit card required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <MagneticButton
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            Get Started Free
          </MagneticButton>
          <MagneticButton
            onClick={() => router.push('/templates')}
            className="px-8 py-4 bg-white/10 rounded-full font-medium hover:bg-white/15 transition-colors"
          >
            Browse Templates
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="text-xl font-semibold">Pagelink</span>
          </div>

          <div className="flex gap-8 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>

          <div className="text-sm text-white/30">
            © 2025 Pagelink
          </div>
        </div>
      </div>
    </footer>
  )
}
