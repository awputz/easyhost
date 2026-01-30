'use client'

import { useState } from 'react'
import { Mail, User, Building2, Phone, Loader2, Lock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeadCaptureConfig } from './lead-capture-settings'

interface EmailGateProps {
  documentSlug: string
  documentTitle: string
  config: LeadCaptureConfig
  onSubmit: (data: LeadData) => Promise<void>
  previewHtml?: string
}

export interface LeadData {
  email: string
  name?: string
  company?: string
  phone?: string
  customFields?: Record<string, string>
}

export function EmailGate({
  documentSlug,
  documentTitle,
  config,
  onSubmit,
  previewHtml,
}: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (config.requireName && !name.trim()) {
      setError('Name is required')
      return
    }

    if (config.requireCompany && !company.trim()) {
      setError('Company is required')
      return
    }

    if (config.requirePhone && !phone.trim()) {
      setError('Phone number is required')
      return
    }

    // Check required custom fields
    for (const field of config.customFields) {
      if (field.required && !customFieldValues[field.name]?.trim()) {
        setError(`${field.name} is required`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        email: email.trim(),
        name: name.trim() || undefined,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Preview section (if enabled) */}
      {config.showPreview && previewHtml && (
        <div className="relative">
          <div
            className="max-h-[50vh] overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          >
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[60vh] pointer-events-none"
              title="Document Preview"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
      )}

      {/* Email capture form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {config.headline}
            </h1>
            <p className="text-zinc-400">
              {config.description}
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              {documentTitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email (always required) */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Name */}
            {config.requireName && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* Company */}
            {config.requireCompany && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Company <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    placeholder="Acme Inc."
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            {config.requirePhone && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {config.customFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  {field.name} {field.required && <span className="text-red-400">*</span>}
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={customFieldValues[field.name] || ''}
                    onChange={(e) =>
                      setCustomFieldValues({
                        ...customFieldValues,
                        [field.name]: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                    placeholder={`Enter ${field.name.toLowerCase()}`}
                    required={field.required}
                  />
                </div>
              </div>
            ))}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-500 py-3 text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                config.buttonText
              )}
            </Button>

            {/* Privacy note */}
            <p className="text-xs text-zinc-500 text-center">
              Your information will be shared with the document owner.
              By submitting, you agree to receive communications about this document.
            </p>
          </form>

          {/* Powered by */}
          <div className="mt-8 text-center">
            <a
              href="https://pagelink.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Powered by Pagelink
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
