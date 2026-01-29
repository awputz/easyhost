'use client'

import { useState } from 'react'
import {
  X,
  Globe,
  Lock,
  Link2,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentSettingsProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    slug: string
    title: string
    theme: string
    isPublic: boolean
    hasPassword: boolean
    expiresAt: string | null
    allowedEmails: string[] | null
    showPagelinkBadge: boolean
  }
  onSave: (settings: DocumentSettings) => Promise<void>
  onDelete: () => Promise<void>
}

interface DocumentSettings {
  slug: string
  isPublic: boolean
  password: string | null
  removePassword: boolean
  expiresAt: string | null
  allowedEmails: string[]
  showPagelinkBadge: boolean
  theme: string
}

const THEMES = [
  { id: 'midnight', name: 'Midnight', color: '#0a1628' },
  { id: 'charcoal', name: 'Charcoal', color: '#2C2C2C' },
  { id: 'slate', name: 'Slate', color: '#3D4F5F' },
  { id: 'obsidian', name: 'Obsidian', color: '#0f0f0f' },
  { id: 'ocean', name: 'Ocean', color: '#0c2d48' },
  { id: 'forest', name: 'Forest', color: '#1a3c34' },
  { id: 'wine', name: 'Wine', color: '#4a1c2e' },
  { id: 'cream', name: 'Cream', color: '#f5f5dc' },
  { id: 'white', name: 'White', color: '#ffffff' },
]

export function DocumentSettings({
  isOpen,
  onClose,
  document,
  onSave,
  onDelete,
}: DocumentSettingsProps) {
  const [slug, setSlug] = useState(document.slug)
  const [isPublic, setIsPublic] = useState(document.isPublic)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [removePassword, setRemovePassword] = useState(false)
  const [expiresAt, setExpiresAt] = useState(document.expiresAt || '')
  const [allowedEmails, setAllowedEmails] = useState(
    document.allowedEmails?.join('\n') || ''
  )
  const [showPagelinkBadge, setShowPagelinkBadge] = useState(document.showPagelinkBadge)
  const [theme, setTheme] = useState(document.theme)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugError, setSlugError] = useState('')

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}`

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
    setSlugError('')
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!slug) {
      setSlugError('Slug is required')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        slug,
        isPublic,
        password: password || null,
        removePassword,
        expiresAt: expiresAt || null,
        allowedEmails: allowedEmails
          .split('\n')
          .map(e => e.trim())
          .filter(Boolean),
        showPagelinkBadge,
        theme,
      })
      onClose()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
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
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Document Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL/Slug */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Link2 className="w-4 h-4 inline mr-2" />
              Document URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                <span className="px-3 text-sm text-zinc-500">pagelink.com/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 bg-transparent py-2 pr-3 text-white text-sm focus:outline-none"
                  placeholder="my-document"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="border-zinc-700"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {slugError && (
              <p className="text-red-400 text-sm mt-1">{slugError}</p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {isPublic ? <Globe className="w-4 h-4 inline mr-2" /> : <Lock className="w-4 h-4 inline mr-2" />}
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isPublic
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Public
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  !isPublic
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Private
              </button>
            </div>
          </div>

          {/* Password Protection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password Protection
            </label>
            {document.hasPassword && !removePassword ? (
              <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                <span className="text-sm text-zinc-400">Password is set</span>
                <button
                  onClick={() => setRemovePassword(true)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter password (optional)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Leave empty for no expiration
            </p>
          </div>

          {/* Email Whitelist */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Email Whitelist
            </label>
            <textarea
              value={allowedEmails}
              onChange={(e) => setAllowedEmails(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              rows={3}
              placeholder="email@example.com&#10;another@example.com"
            />
            <p className="text-xs text-zinc-500 mt-1">
              One email per line. Leave empty to allow anyone.
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    theme === t.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div
                    className="w-full h-6 rounded mb-2"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs text-zinc-400">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pagelink Badge */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Show "Made with Pagelink" badge
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Upgrade to Pro to remove
              </p>
            </div>
            <button
              onClick={() => setShowPagelinkBadge(!showPagelinkBadge)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                showPagelinkBadge ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  showPagelinkBadge ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
