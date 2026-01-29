'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Presentation,
  FileSpreadsheet,
  FileText,
  Newspaper,
  BarChart3,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  name: string
  description: string
  icon: typeof FileText
  category: 'business' | 'real-estate' | 'marketing'
  preview: string
  prompt: string
}

const templates: Template[] = [
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Professional startup pitch deck for investors with problem, solution, market, and traction slides.',
    icon: Presentation,
    category: 'business',
    preview: '/templates/pitch-deck-preview.png',
    prompt: 'Create a pitch deck for my startup. Include slides for: problem, solution, market opportunity, traction, team, and funding ask.',
  },
  {
    id: 'investment-memo',
    name: 'Investment Memorandum',
    description: 'Comprehensive real estate investment memo with financials, property details, and market analysis.',
    icon: FileSpreadsheet,
    category: 'real-estate',
    preview: '/templates/investment-memo-preview.png',
    prompt: 'Create an investment memorandum for a commercial real estate property. Include key metrics, property overview, investment highlights, and financials.',
  },
  {
    id: 'consulting-proposal',
    name: 'Consulting Proposal',
    description: 'Polished consulting proposal with executive summary, approach, timeline, and pricing.',
    icon: FileText,
    category: 'business',
    preview: '/templates/proposal-preview.png',
    prompt: 'Create a consulting proposal for a 3-month engagement. Include executive summary, our approach, timeline, team, and investment.',
  },
  {
    id: 'one-pager',
    name: 'Product One-Pager',
    description: 'Concise product overview with key stats, features, testimonials, and call-to-action.',
    icon: FileText,
    category: 'marketing',
    preview: '/templates/one-pager-preview.png',
    prompt: 'Create a one-pager for my product. Include value proposition, key stats, features, testimonial, and CTA.',
  },
  {
    id: 'investor-update',
    name: 'Investor Update',
    description: 'Monthly or quarterly investor update with KPIs, highlights, challenges, and asks.',
    icon: BarChart3,
    category: 'business',
    preview: '/templates/investor-update-preview.png',
    prompt: 'Create a monthly investor update. Include highlights, KPIs, progress against goals, challenges, and asks.',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Compelling customer case study with challenge, solution, results, and testimonial.',
    icon: Newspaper,
    category: 'marketing',
    preview: '/templates/case-study-preview.png',
    prompt: 'Create a customer case study. Include the challenge they faced, our solution, quantified results, and a testimonial.',
  },
]

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'business', name: 'Business' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'marketing', name: 'Marketing' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  const handleUseTemplate = (template: Template) => {
    sessionStorage.setItem('pagelink_initial_prompt', template.prompt)
    router.push('/create')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">Pagelink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200">
              <Link href="/signup">Sign up free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-white/5">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Start with a template
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto">
          Professional templates for pitch decks, investment memos, proposals, and more.
          Customize with AI in seconds.
        </p>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="group relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all"
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                {/* Preview Area */}
                <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <template.icon className="w-16 h-16 text-zinc-800" />
                  </div>

                  {/* Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/80 flex items-center justify-center gap-3 transition-opacity ${
                      hoveredTemplate === template.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 hover:bg-white/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <template.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <span className="text-xs text-zinc-500 capitalize">
                        {template.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don't see what you need?
          </h2>
          <p className="text-zinc-400 mb-8">
            Just describe what you want to create and our AI will build it from scratch.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500">
            <Link href="/create">
              Start from scratch
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-zinc-600">
          <div>© 2025 Pagelink</div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
