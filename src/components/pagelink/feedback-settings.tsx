'use client'

import { useState } from 'react'
import {
  X,
  MessageSquare,
  ThumbsUp,
  Star,
  ToggleLeft,
  ToggleRight,
  Loader2,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type FeedbackType = 'comments' | 'reactions' | 'rating' | 'all'

export interface FeedbackConfig {
  enabled: boolean
  feedbackType: FeedbackType
  allowAnonymous: boolean
  requireEmail: boolean
  moderationEnabled: boolean
  notifyOnNew: boolean
  notifyEmail: string | null
  placeholder: string
  thankYouMessage: string
  position: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

interface FeedbackSettingsProps {
  isOpen: boolean
  onClose: () => void
  config: FeedbackConfig | null
  onSave: (config: FeedbackConfig) => Promise<void>
}

const DEFAULT_CONFIG: FeedbackConfig = {
  enabled: false,
  feedbackType: 'comments',
  allowAnonymous: true,
  requireEmail: false,
  moderationEnabled: true,
  notifyOnNew: false,
  notifyEmail: null,
  placeholder: 'Share your thoughts on this document...',
  thankYouMessage: 'Thank you for your feedback!',
  position: 'bottom-right',
}

export function FeedbackSettings({
  isOpen,
  onClose,
  config,
  onSave,
}: FeedbackSettingsProps) {
  const [settings, setSettings] = useState<FeedbackConfig>(config || DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)

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
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Comments & Feedback</h2>
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
                <MessageCircle className="w-4 h-4 text-amber-400" />
                Enable Feedback
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Allow visitors to leave comments or reactions
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className="text-2xl"
            >
              {settings.enabled ? (
                <ToggleRight className="w-10 h-10 text-amber-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-zinc-600" />
              )}
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Feedback Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'comments', label: 'Comments', icon: MessageSquare, desc: 'Text comments' },
                    { value: 'reactions', label: 'Reactions', icon: ThumbsUp, desc: 'Emoji reactions' },
                    { value: 'rating', label: 'Rating', icon: Star, desc: '5-star rating' },
                    { value: 'all', label: 'All', icon: MessageCircle, desc: 'Everything' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      onClick={() => setSettings({ ...settings, feedbackType: value as FeedbackType })}
                      className={`p-4 rounded-lg border transition-colors text-left ${
                        settings.feedbackType === value
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs opacity-70">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Options
                </label>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-sm text-white">Allow anonymous feedback</span>
                    <p className="text-xs text-zinc-500">No login required</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, allowAnonymous: !settings.allowAnonymous })}>
                    {settings.allowAnonymous ? (
                      <ToggleRight className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-sm text-white">Require email</span>
                    <p className="text-xs text-zinc-500">Ask for email with feedback</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, requireEmail: !settings.requireEmail })}>
                    {settings.requireEmail ? (
                      <ToggleRight className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-sm text-white">Moderation</span>
                    <p className="text-xs text-zinc-500">Review before publishing</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, moderationEnabled: !settings.moderationEnabled })}>
                    {settings.moderationEnabled ? (
                      <ToggleRight className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Notifications
                </label>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-sm text-white">Email on new feedback</span>
                    <p className="text-xs text-zinc-500">Get notified of new comments</p>
                  </div>
                  <button onClick={() => setSettings({ ...settings, notifyOnNew: !settings.notifyOnNew })}>
                    {settings.notifyOnNew ? (
                      <ToggleRight className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                {settings.notifyOnNew && (
                  <input
                    type="email"
                    value={settings.notifyEmail || ''}
                    onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value || null })}
                    placeholder="notification@email.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                )}
              </div>

              {/* Widget Position */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Widget Position
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'bottom-left', label: 'Left' },
                    { value: 'bottom-center', label: 'Center' },
                    { value: 'bottom-right', label: 'Right' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSettings({ ...settings, position: value as FeedbackConfig['position'] })}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        settings.position === value
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={settings.placeholder}
                    onChange={(e) => setSettings({ ...settings, placeholder: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Thank You Message
                  </label>
                  <input
                    type="text"
                    value={settings.thankYouMessage}
                    onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500">
            {settings.enabled ? (
              <span className="flex items-center gap-1 text-amber-400">
                <MessageCircle className="w-3 h-3" />
                Feedback is enabled
              </span>
            ) : (
              <span>Feedback is disabled</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-500"
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
