'use client'

import { useState } from 'react'
import {
  X,
  Search,
  Image,
  FileText,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SEOConfig {
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  ogType: string
  twitterCard: string
  canonicalUrl: string | null
  noIndex: boolean
  keywords: string | null
}

interface SEOSettingsProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    slug: string
    title: string
    seo?: SEOConfig | null
  }
  onSave: (seo: SEOConfig) => Promise<void>
}

const OG_TYPES = [
  { id: 'article', name: 'Article' },
  { id: 'website', name: 'Website' },
  { id: 'profile', name: 'Profile' },
  { id: 'product', name: 'Product' },
]

const TWITTER_CARDS = [
  { id: 'summary', name: 'Summary' },
  { id: 'summary_large_image', name: 'Large Image' },
]

export function SEOSettings({
  isOpen,
  onClose,
  document,
  onSave,
}: SEOSettingsProps) {
  const [metaTitle, setMetaTitle] = useState(document.seo?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(document.seo?.metaDescription || '')
  const [ogImageUrl, setOgImageUrl] = useState(document.seo?.ogImageUrl || '')
  const [ogType, setOgType] = useState(document.seo?.ogType || 'article')
  const [twitterCard, setTwitterCard] = useState(document.seo?.twitterCard || 'summary_large_image')
  const [canonicalUrl, setCanonicalUrl] = useState(document.seo?.canonicalUrl || '')
  const [noIndex, setNoIndex] = useState(document.seo?.noIndex || false)
  const [keywords, setKeywords] = useState(document.seo?.keywords || '')
  const [isSaving, setIsSaving] = useState(false)
  const [activePreview, setActivePreview] = useState<'google' | 'twitter' | 'linkedin' | 'facebook'>('google')

  const displayTitle = metaTitle || document.title
  const displayDescription = metaDescription || 'View this document on Pagelink'
  const displayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${document.slug}`
    : `pagelink.com/${document.slug}`

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImageUrl: ogImageUrl || null,
        ogType,
        twitterCard,
        canonicalUrl: canonicalUrl || null,
        noIndex,
        keywords: keywords || null,
      })
      onClose()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateSEO = () => {
    // Auto-generate meta description based on title
    if (!metaDescription && document.title) {
      setMetaDescription(`${document.title} - Created with Pagelink. View this professional document online.`)
    }
    // Auto-generate keywords based on title
    if (!keywords && document.title) {
      const words = document.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      setKeywords(words.slice(0, 5).join(', '))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">SEO & Social Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auto-generate button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSEO}
              className="border-zinc-700 text-zinc-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-generate
            </Button>
          </div>

          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={document.title}
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-zinc-500">
                Overrides the page title in search results
              </p>
              <span className={`text-xs ${metaTitle.length > 55 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {metaTitle.length}/60
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              rows={3}
              placeholder="Brief description for search engines and social media..."
              maxLength={160}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-zinc-500">
                Appears in search results and social previews
              </p>
              <span className={`text-xs ${metaDescription.length > 155 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {metaDescription.length}/160
              </span>
            </div>
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Image className="w-4 h-4 inline mr-2" />
              Social Image (OG Image)
            </label>
            <input
              type="url"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Recommended: 1200×630px for optimal display
            </p>
          </div>

          {/* OG Type & Twitter Card */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Content Type
              </label>
              <select
                value={ogType}
                onChange={(e) => setOgType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {OG_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Twitter Card Type
              </label>
              <select
                value={twitterCard}
                onChange={(e) => setTwitterCard(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {TWITTER_CARDS.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Link2 className="w-4 h-4 inline mr-2" />
              Canonical URL (optional)
            </label>
            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="https://example.com/original-page"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Use if this content exists elsewhere
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Comma-separated keywords for search engines
            </p>
          </div>

          {/* No Index Toggle */}
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div>
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Hide from search engines
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Adds noindex tag to prevent indexing
              </p>
            </div>
            <button
              onClick={() => setNoIndex(!noIndex)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                noIndex ? 'bg-amber-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  noIndex ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Preview Section */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Social Preview
            </label>

            {/* Preview tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'google', icon: Search, label: 'Google' },
                { id: 'twitter', icon: Twitter, label: 'Twitter' },
                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { id: 'facebook', icon: Facebook, label: 'Facebook' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActivePreview(id as typeof activePreview)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activePreview === id
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Preview content */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
              {activePreview === 'google' && (
                <div className="space-y-1">
                  <div className="text-sm text-zinc-500">{displayUrl}</div>
                  <div className="text-lg text-blue-400 hover:underline cursor-pointer">
                    {displayTitle}
                  </div>
                  <div className="text-sm text-zinc-400 line-clamp-2">
                    {displayDescription}
                  </div>
                </div>
              )}

              {(activePreview === 'twitter' || activePreview === 'facebook' || activePreview === 'linkedin') && (
                <div className="rounded-xl overflow-hidden border border-zinc-700">
                  {ogImageUrl ? (
                    <div
                      className="w-full h-40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${ogImageUrl})` }}
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white/60 text-sm">No image set</span>
                    </div>
                  )}
                  <div className="p-3 bg-zinc-900">
                    <div className="text-xs text-zinc-500 uppercase">
                      {displayUrl.replace(/^https?:\/\//, '').split('/')[0]}
                    </div>
                    <div className="text-sm font-medium text-white mt-1 line-clamp-1">
                      {displayTitle}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {displayDescription}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-zinc-700">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Save SEO Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
