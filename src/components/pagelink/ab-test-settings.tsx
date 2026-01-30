'use client'

import { useState } from 'react'
import {
  X,
  FlaskConical,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  BarChart2,
  Trophy,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ABVariant {
  id: string
  name: string
  html: string
  trafficPercent: number
  views: number
  conversions: number
  conversionRate: number
}

export interface ABTestConfig {
  enabled: boolean
  testName: string
  variants: ABVariant[]
  goalType: 'clicks' | 'time_on_page' | 'scroll_depth' | 'custom'
  goalSelector?: string // For click tracking
  minSampleSize: number
  confidenceLevel: number
  winnerId?: string | null
  startedAt?: string | null
  endedAt?: string | null
}

interface ABTestSettingsProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentHtml: string
  config: ABTestConfig | null
  onSave: (config: ABTestConfig) => Promise<void>
}

const DEFAULT_CONFIG: ABTestConfig = {
  enabled: false,
  testName: 'A/B Test',
  variants: [],
  goalType: 'clicks',
  goalSelector: 'a, button',
  minSampleSize: 100,
  confidenceLevel: 95,
  winnerId: null,
  startedAt: null,
  endedAt: null,
}

export function ABTestSettings({
  isOpen,
  onClose,
  documentId,
  documentHtml,
  config,
  onSave,
}: ABTestSettingsProps) {
  const [settings, setSettings] = useState<ABTestConfig>(config || DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [newVariantName, setNewVariantName] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addVariant = () => {
    if (!newVariantName.trim()) return

    const existingPercent = settings.variants.reduce((sum, v) => sum + v.trafficPercent, 0)
    const remainingPercent = Math.max(0, 100 - existingPercent)

    const newVariant: ABVariant = {
      id: `variant-${Date.now()}`,
      name: newVariantName.trim(),
      html: documentHtml, // Start with current document HTML
      trafficPercent: Math.min(remainingPercent, Math.floor(100 / (settings.variants.length + 1))),
      views: 0,
      conversions: 0,
      conversionRate: 0,
    }

    // Rebalance traffic
    const newVariants = [...settings.variants, newVariant]
    const equalPercent = Math.floor(100 / newVariants.length)
    const remainder = 100 - (equalPercent * newVariants.length)

    const balancedVariants = newVariants.map((v, i) => ({
      ...v,
      trafficPercent: equalPercent + (i === 0 ? remainder : 0),
    }))

    setSettings({ ...settings, variants: balancedVariants })
    setNewVariantName('')
  }

  const removeVariant = (variantId: string) => {
    const newVariants = settings.variants.filter(v => v.id !== variantId)

    if (newVariants.length > 0) {
      // Rebalance traffic
      const equalPercent = Math.floor(100 / newVariants.length)
      const remainder = 100 - (equalPercent * newVariants.length)

      const balancedVariants = newVariants.map((v, i) => ({
        ...v,
        trafficPercent: equalPercent + (i === 0 ? remainder : 0),
      }))

      setSettings({ ...settings, variants: balancedVariants })
    } else {
      setSettings({ ...settings, variants: [] })
    }
  }

  const updateTrafficPercent = (variantId: string, percent: number) => {
    const clampedPercent = Math.max(0, Math.min(100, percent))
    const otherVariants = settings.variants.filter(v => v.id !== variantId)
    const otherTotal = otherVariants.reduce((sum, v) => sum + v.trafficPercent, 0)

    // If changing would exceed 100%, adjust others proportionally
    if (clampedPercent + otherTotal > 100) {
      const scale = (100 - clampedPercent) / otherTotal
      const adjustedVariants = settings.variants.map(v => {
        if (v.id === variantId) {
          return { ...v, trafficPercent: clampedPercent }
        }
        return { ...v, trafficPercent: Math.floor(v.trafficPercent * scale) }
      })
      setSettings({ ...settings, variants: adjustedVariants })
    } else {
      const updatedVariants = settings.variants.map(v =>
        v.id === variantId ? { ...v, trafficPercent: clampedPercent } : v
      )
      setSettings({ ...settings, variants: updatedVariants })
    }
  }

  const totalTraffic = settings.variants.reduce((sum, v) => sum + v.trafficPercent, 0)
  const hasWinner = settings.winnerId !== null

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
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">A/B Testing</h2>
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
          {/* Enable Toggle */}
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Enable A/B Testing
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Test different versions to find what works best
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className="text-2xl"
            >
              {settings.enabled ? (
                <ToggleRight className="w-10 h-10 text-cyan-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-zinc-600" />
              )}
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  value={settings.testName}
                  onChange={(e) => setSettings({ ...settings, testName: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., CTA Button Color Test"
                />
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">
                    Variants
                  </label>
                  <span className={`text-xs ${totalTraffic === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                    Total: {totalTraffic}%
                  </span>
                </div>

                <div className="space-y-3 mb-3">
                  {settings.variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="font-medium text-white">{variant.name}</span>
                          {settings.winnerId === variant.id && (
                            <Trophy className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <button
                          onClick={() => removeVariant(variant.id)}
                          className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-zinc-500 mb-1">
                            Traffic Split
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={variant.trafficPercent}
                              onChange={(e) => updateTrafficPercent(variant.id, parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm text-white w-12 text-right">
                              {variant.trafficPercent}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {variant.views > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700 grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-white">{variant.views}</div>
                            <div className="text-xs text-zinc-500">Views</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">{variant.conversions}</div>
                            <div className="text-xs text-zinc-500">Conversions</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-cyan-400">
                              {variant.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-zinc-500">Rate</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Variant */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="New variant name..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && addVariant()}
                  />
                  <Button
                    variant="outline"
                    onClick={addVariant}
                    disabled={!newVariantName.trim()}
                    className="border-zinc-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {settings.variants.length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Add at least 2 variants to start testing
                  </div>
                )}
              </div>

              {/* Goal Configuration */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Conversion Goal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'clicks', label: 'Link/Button Clicks' },
                    { value: 'time_on_page', label: 'Time on Page' },
                    { value: 'scroll_depth', label: 'Scroll Depth' },
                    { value: 'custom', label: 'Custom Event' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSettings({ ...settings, goalType: value as ABTestConfig['goalType'] })}
                      className={`p-3 rounded-lg border transition-colors text-left text-sm ${
                        settings.goalType === value
                          ? 'bg-cyan-500/20 border-cyan-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {settings.goalType === 'clicks' && (
                  <div className="mt-3">
                    <label className="block text-xs text-zinc-500 mb-1">
                      CSS Selector (what to track)
                    </label>
                    <input
                      type="text"
                      value={settings.goalSelector || ''}
                      onChange={(e) => setSettings({ ...settings, goalSelector: e.target.value })}
                      placeholder="a, button, .cta-button"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Statistical Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Min Sample Size
                  </label>
                  <input
                    type="number"
                    value={settings.minSampleSize}
                    onChange={(e) => setSettings({ ...settings, minSampleSize: parseInt(e.target.value) || 100 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Confidence Level
                  </label>
                  <select
                    value={settings.confidenceLevel}
                    onChange={(e) => setSettings({ ...settings, confidenceLevel: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="90">90%</option>
                    <option value="95">95%</option>
                    <option value="99">99%</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500">
            {settings.enabled ? (
              settings.variants.length >= 2 ? (
                <span className="flex items-center gap-1 text-cyan-400">
                  <BarChart2 className="w-3 h-3" />
                  {settings.variants.length} variants configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  Need at least 2 variants
                </span>
              )
            ) : (
              <span>A/B testing is disabled</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (settings.enabled && settings.variants.length < 2)}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
