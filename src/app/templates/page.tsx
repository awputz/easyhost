'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-navy-800 text-cream-50 rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-navy-100 bg-white">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-navy-900 mb-4">
          Start with a template
        </h1>
        <p className="text-lg text-navy-500 max-w-xl mx-auto">
          Professional templates for pitch decks, investment memos, proposals, and more.
          Customize with AI in seconds.
        </p>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 bg-cream-50/95 backdrop-blur-sm border-b border-navy-100 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-navy-800 text-cream-50'
                    : 'bg-white text-navy-600 hover:bg-navy-50 border border-navy-100'
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
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-navy-100">
                  <div className="aspect-[4/3] bg-navy-100 rounded-lg mb-4" />
                  <div className="h-4 bg-navy-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-navy-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="group relative bg-white rounded-xl border border-navy-100 overflow-hidden hover:border-navy-200 hover:shadow-md transition-all"
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  {/* Preview Area */}
                  <div className="aspect-[4/3] bg-cream-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl text-navy-200">📄</span>
                    </div>

                    {/* Hover Overlay */}
                    <div
                      className={`absolute inset-0 bg-navy-900/80 flex items-center justify-center gap-3 transition-opacity ${
                        hoveredTemplate === template.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <button
                        className="px-4 py-2 bg-white/10 text-cream-50 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
                        onClick={() => handlePreview(template)}
                      >
                        Preview
                      </button>
                      <button
                        className="px-4 py-2 bg-navy-600 text-cream-50 rounded-lg text-sm font-medium hover:bg-navy-500 transition-colors disabled:opacity-50"
                        onClick={() => handleUseTemplate(template)}
                        disabled={creatingFromTemplate === template.id}
                      >
                        {creatingFromTemplate === template.id ? 'Creating...' : 'Use Template →'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                        <span className="text-navy-500">📄</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-900">{template.name}</h3>
                        <span className="text-xs text-navy-400 capitalize">
                          {template.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-navy-500 line-clamp-2">
                      {template.description}
                    </p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-navy-50 text-navy-500 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-navy-900 mb-4">
            Don't see what you need?
          </h2>
          <p className="text-navy-500 mb-8">
            Just describe what you want to create and our AI will build it from scratch.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-800 text-cream-50 rounded-lg font-medium hover:bg-navy-700 transition-colors"
          >
            Start from scratch
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-100 py-6 bg-white">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-navy-400">
          <div>&copy; 2025 Pagelink</div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-navy-700 transition-colors">Pricing</Link>
            <Link href="/" className="hover:text-navy-700 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-navy-700 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-navy-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-navy-100 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-navy-100">
              <div>
                <h3 className="text-lg font-semibold text-navy-900">{previewTemplate.name}</h3>
                <p className="text-sm text-navy-500">{previewTemplate.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Device Toggle */}
                <div className="flex bg-navy-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1.5 rounded text-sm ${previewDevice === 'desktop' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`px-3 py-1.5 rounded text-sm ${previewDevice === 'tablet' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1.5 rounded text-sm ${previewDevice === 'mobile' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500'}`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  className="px-4 py-2 bg-navy-800 text-cream-50 rounded-lg text-sm font-medium hover:bg-navy-700 transition-colors disabled:opacity-50"
                  onClick={() => {
                    setPreviewTemplate(null)
                    handleUseTemplate(previewTemplate)
                  }}
                  disabled={creatingFromTemplate === previewTemplate.id}
                >
                  {creatingFromTemplate === previewTemplate.id ? 'Creating...' : 'Use Template'}
                </button>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-navy-100 rounded-lg transition-colors text-navy-500"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-cream-100 p-6">
              <div
                className="mx-auto transition-all duration-300 h-full"
                style={{ maxWidth: DEVICE_WIDTHS[previewDevice] }}
              >
                {previewLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-navy-500">Loading preview...</div>
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-lg"
                    title="Template Preview"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-navy-400">
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
