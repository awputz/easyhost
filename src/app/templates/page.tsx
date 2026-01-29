'use client'

import { useState, useEffect } from 'react'
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
  X,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  name: string
  description: string
  category: 'business' | 'real-estate' | 'marketing' | 'personal'
  thumbnail: string
  tags: string[]
  defaultTitle: string
}

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  'pitch-deck': Presentation,
  'investment-memo': FileSpreadsheet,
  'consulting-proposal': FileText,
  'product-one-pager': FileText,
  'investor-update': BarChart3,
  'case-study': Newspaper,
}

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'business', name: 'Business' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'marketing', name: 'Marketing' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<DeviceSize>('desktop')
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/pagelink/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (template: Template) => {
    setPreviewTemplate(template)
    setPreviewLoading(true)
    setPreviewHtml(null)

    try {
      const response = await fetch(`/api/pagelink/templates/${template.id}`)
      if (response.ok) {
        const data = await response.json()
        setPreviewHtml(data.html)
      }
    } catch (error) {
      console.error('Error fetching template preview:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleUseTemplate = async (template: Template) => {
    setCreatingFromTemplate(template.id)

    try {
      // Fetch the full template with HTML
      const response = await fetch(`/api/pagelink/templates/${template.id}`)
      if (!response.ok) throw new Error('Failed to fetch template')

      const templateData = await response.json()

      // Create a new document from the template
      const createResponse = await fetch('/api/pagelink/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.defaultTitle,
          html: templateData.html,
          document_type: template.id.replace('-', '_'),
          theme: 'midnight',
        }),
      })

      if (!createResponse.ok) {
        // If not authenticated, store in session and redirect to create
        sessionStorage.setItem('pagelink_template_html', templateData.html)
        sessionStorage.setItem('pagelink_template_title', template.defaultTitle)
        router.push('/create')
        return
      }

      const newDoc = await createResponse.json()
      router.push(`/d/${newDoc.slug}`)
    } catch (error) {
      console.error('Error creating from template:', error)
      // Fallback to prompt-based creation
      const prompts: Record<string, string> = {
        'pitch-deck': 'Create a pitch deck for my startup',
        'investment-memo': 'Create an investment memorandum for a commercial property',
        'consulting-proposal': 'Create a consulting proposal for a 3-month engagement',
        'product-one-pager': 'Create a one-pager for my product',
        'investor-update': 'Create a monthly investor update',
        'case-study': 'Create a customer case study',
      }
      sessionStorage.setItem('pagelink_initial_prompt', prompts[template.id] || 'Create a document')
      router.push('/create')
    } finally {
      setCreatingFromTemplate(null)
    }
  }

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  const getIcon = (templateId: string) => CATEGORY_ICONS[templateId] || FileText

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
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl p-6 animate-pulse">
                  <div className="aspect-[4/3] bg-zinc-800 rounded-lg mb-4" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => {
                const Icon = getIcon(template.id)
                return (
                  <div
                    key={template.id}
                    className="group relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all"
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                  >
                    {/* Preview Area */}
                    <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-16 h-16 text-zinc-800" />
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
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500"
                          onClick={() => handleUseTemplate(template)}
                          disabled={creatingFromTemplate === template.id}
                        >
                          {creatingFromTemplate === template.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Use Template
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-zinc-400" />
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
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-white">{previewTemplate.name}</h3>
                <p className="text-sm text-zinc-500">{previewTemplate.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Device Toggle */}
                <div className="flex bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-2 rounded ${previewDevice === 'tablet' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  className="bg-blue-600 hover:bg-blue-500"
                  onClick={() => {
                    setPreviewTemplate(null)
                    handleUseTemplate(previewTemplate)
                  }}
                  disabled={creatingFromTemplate === previewTemplate.id}
                >
                  {creatingFromTemplate === previewTemplate.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Use Template
                </Button>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-zinc-950 p-6">
              <div
                className="mx-auto transition-all duration-300 h-full"
                style={{ maxWidth: DEVICE_WIDTHS[previewDevice] }}
              >
                {previewLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-2xl"
                    title="Template Preview"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Failed to load preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
