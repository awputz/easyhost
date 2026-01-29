'use client'

import { useState } from 'react'
import {
  X,
  Image,
  Palette,
  Type,
  FileText,
  Loader2,
  Check,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface BrandingConfig {
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  fontFamily: string
  footerText: string | null
  footerLink: string | null
  customCss: string | null
}

interface BrandingSettingsProps {
  isOpen: boolean
  onClose: () => void
  branding: BrandingConfig
  onSave: (branding: BrandingConfig) => Promise<void>
}

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif" },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif" },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif" },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { id: 'opensans', name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { id: 'lato', name: 'Lato', family: "'Lato', sans-serif" },
  { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', serif" },
]

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#3B82F6', accent: '#60A5FA' },
  { name: 'Violet', primary: '#8B5CF6', accent: '#A78BFA' },
  { name: 'Rose', primary: '#F43F5E', accent: '#FB7185' },
  { name: 'Emerald', primary: '#10B981', accent: '#34D399' },
  { name: 'Orange', primary: '#F97316', accent: '#FB923C' },
  { name: 'Slate', primary: '#475569', accent: '#64748B' },
]

export function BrandingSettings({
  isOpen,
  onClose,
  branding,
  onSave,
}: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || '')
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || '#3B82F6')
  const [accentColor, setAccentColor] = useState(branding.accentColor || '#60A5FA')
  const [fontFamily, setFontFamily] = useState(branding.fontFamily || 'inter')
  const [footerText, setFooterText] = useState(branding.footerText || '')
  const [footerLink, setFooterLink] = useState(branding.footerLink || '')
  const [customCss, setCustomCss] = useState(branding.customCss || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showCustomCss, setShowCustomCss] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        logoUrl: logoUrl || null,
        primaryColor,
        accentColor,
        fontFamily,
        footerText: footerText || null,
        footerLink: footerLink || null,
        customCss: customCss || null,
      })
      onClose()
    } catch (error) {
      console.error('Save branding error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary)
    setAccentColor(preset.accent)
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
          <h2 className="text-lg font-semibold text-white">Brand Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Image className="w-4 h-4 inline mr-2" />
              Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Enter the URL of your logo image (PNG, SVG recommended)
            </p>
            {logoUrl && (
              <div className="mt-3 p-3 bg-zinc-800 rounded-lg">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Palette className="w-4 h-4 inline mr-2" />
              Color Presets
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className={`p-2 rounded-lg border transition-colors ${
                    primaryColor === preset.primary
                      ? 'border-white'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                  title={preset.name}
                >
                  <div
                    className="w-full h-6 rounded"
                    style={{
                      background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.accent} 100%)`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Type className="w-4 h-4 inline mr-2" />
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    fontFamily === font.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <span
                    className="text-white"
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Custom Footer
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Your Company Name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2"
            />
            <input
              type="url"
              value={footerLink}
              onChange={(e) => setFooterLink(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Add your company name and website link to the footer
            </p>
          </div>

          {/* Custom CSS Toggle */}
          <div>
            <button
              onClick={() => setShowCustomCss(!showCustomCss)}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {showCustomCss ? 'Hide' : 'Show'} Advanced CSS
            </button>
            {showCustomCss && (
              <div className="mt-2">
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder="/* Custom CSS styles */"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  rows={4}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Advanced: Add custom CSS to override document styles
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-3">Preview</p>
            <div
              className="p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20 0%, ${accentColor}20 100%)`,
                borderLeft: `4px solid ${primaryColor}`,
              }}
            >
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-6 mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <p
                className="text-white"
                style={{
                  fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.family,
                }}
              >
                Sample heading text
              </p>
              <p
                className="text-sm text-zinc-400 mt-1"
                style={{
                  fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.family,
                }}
              >
                This is how your document text will look.
              </p>
              {footerText && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    {footerLink ? (
                      <a
                        href={footerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: primaryColor }}
                      >
                        {footerText}
                      </a>
                    ) : (
                      footerText
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-zinc-700">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Branding
          </Button>
        </div>
      </div>
    </div>
  )
}

export { FONT_OPTIONS }
