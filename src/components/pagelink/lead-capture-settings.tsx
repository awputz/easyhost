'use client'

import { useState } from 'react'
import {
  X,
  Mail,
  Users,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Download,
  Eye,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface LeadCaptureConfig {
  enabled: boolean
  requireEmail: boolean
  requireName: boolean
  requireCompany: boolean
  requirePhone: boolean
  customFields: { name: string; required: boolean }[]
  headline: string
  description: string
  buttonText: string
  showPreview: boolean // Allow preview before submitting
  previewPercentage: number // How much of document to show as preview
}

interface LeadCaptureSettingsProps {
  isOpen: boolean
  onClose: () => void
  config: LeadCaptureConfig | null
  onSave: (config: LeadCaptureConfig) => Promise<void>
}

const DEFAULT_CONFIG: LeadCaptureConfig = {
  enabled: false,
  requireEmail: true,
  requireName: false,
  requireCompany: false,
  requirePhone: false,
  customFields: [],
  headline: 'Get access to this document',
  description: 'Enter your email to view the full document.',
  buttonText: 'View Document',
  showPreview: true,
  previewPercentage: 30,
}

export function LeadCaptureSettings({
  isOpen,
  onClose,
  config,
  onSave,
}: LeadCaptureSettingsProps) {
  const [settings, setSettings] = useState<LeadCaptureConfig>(config || DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')

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

  const addCustomField = () => {
    if (!newFieldName.trim()) return
    setSettings({
      ...settings,
      customFields: [...settings.customFields, { name: newFieldName.trim(), required: false }],
    })
    setNewFieldName('')
  }

  const removeCustomField = (index: number) => {
    setSettings({
      ...settings,
      customFields: settings.customFields.filter((_, i) => i !== index),
    })
  }

  const toggleCustomFieldRequired = (index: number) => {
    setSettings({
      ...settings,
      customFields: settings.customFields.map((field, i) =>
        i === index ? { ...field, required: !field.required } : field
      ),
    })
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
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Lead Capture</h2>
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
                {settings.enabled ? (
                  <Lock className="w-4 h-4 text-green-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-zinc-400" />
                )}
                Email Gate
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Require visitors to submit info before viewing
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className="text-2xl"
            >
              {settings.enabled ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-zinc-600" />
              )}
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Required Fields */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Required Fields
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'requireEmail', label: 'Email Address', icon: Mail, locked: true },
                    { key: 'requireName', label: 'Full Name', icon: Users },
                    { key: 'requireCompany', label: 'Company', icon: FileText },
                    { key: 'requirePhone', label: 'Phone Number', icon: FileText },
                  ].map(({ key, label, icon: Icon, locked }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-white">{label}</span>
                        {locked && (
                          <span className="text-xs text-zinc-500">(Always required)</span>
                        )}
                      </div>
                      {!locked && (
                        <button
                          onClick={() =>
                            setSettings({
                              ...settings,
                              [key]: !settings[key as keyof LeadCaptureConfig],
                            })
                          }
                        >
                          {settings[key as keyof LeadCaptureConfig] ? (
                            <ToggleRight className="w-8 h-8 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-zinc-600" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Fields */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Custom Fields
                </label>
                <div className="space-y-2 mb-3">
                  {settings.customFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
                    >
                      <span className="text-sm text-white">{field.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCustomFieldRequired(index)}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          {field.required ? 'Required' : 'Optional'}
                        </button>
                        <button
                          onClick={() => removeCustomField(index)}
                          className="p-1 hover:bg-zinc-700 rounded"
                        >
                          <X className="w-4 h-4 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Add custom field..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                  />
                  <Button
                    variant="outline"
                    onClick={addCustomField}
                    className="border-zinc-600"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Form Text */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={settings.headline}
                    onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    placeholder="Get access to this document"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    rows={2}
                    placeholder="Enter your email to view the full document."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={settings.buttonText}
                    onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    placeholder="View Document"
                  />
                </div>
              </div>

              {/* Preview Settings */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Show Preview
                    </label>
                    <p className="text-xs text-zinc-500 mt-1">
                      Let visitors see part of the document before submitting
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, showPreview: !settings.showPreview })}
                  >
                    {settings.showPreview ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
                {settings.showPreview && (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">
                      Preview percentage: {settings.previewPercentage}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="10"
                      value={settings.previewPercentage}
                      onChange={(e) =>
                        setSettings({ ...settings, previewPercentage: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500">
            {settings.enabled ? (
              <span className="flex items-center gap-1 text-green-400">
                <Lock className="w-3 h-3" />
                Email gate is enabled
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                Document is publicly accessible
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-500"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
