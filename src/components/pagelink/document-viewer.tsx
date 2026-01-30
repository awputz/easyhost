'use client'

import { useState, useEffect } from 'react'
import { PasswordGate } from './password-gate'
import { EmailGate, LeadData } from './email-gate'
import { FeedbackWidget } from './feedback-widget'
import type { LeadCaptureConfig } from './lead-capture-settings'
import type { FeedbackConfig } from './feedback-settings'

export interface BrandingConfig {
  logoUrl?: string | null
  primaryColor?: string
  accentColor?: string
  fontFamily?: string
  footerText?: string | null
  footerLink?: string | null
  customCss?: string | null
}

interface DocumentViewerProps {
  documentId?: string
  slug: string
  title: string
  html: string | null
  hasPassword: boolean
  showBadge: boolean
  branding?: BrandingConfig | null
  leadCapture?: LeadCaptureConfig | null
  feedbackConfig?: FeedbackConfig | null
}

const FONT_IMPORTS: Record<string, string> = {
  inter: "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');",
  roboto: "@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');",
  poppins: "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');",
  playfair: "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');",
  montserrat: "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');",
  opensans: "@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');",
  lato: "@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');",
  merriweather: "@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');",
}

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
  montserrat: "'Montserrat', sans-serif",
  opensans: "'Open Sans', sans-serif",
  lato: "'Lato', sans-serif",
  merriweather: "'Merriweather', serif",
}

export function DocumentViewer({
  documentId,
  slug,
  title,
  html: initialHtml,
  hasPassword,
  showBadge,
  branding,
  leadCapture,
  feedbackConfig,
}: DocumentViewerProps) {
  const [html, setHtml] = useState(initialHtml)
  const [leadCaptured, setLeadCaptured] = useState(false)

  // Check localStorage for lead capture bypass
  useEffect(() => {
    if (leadCapture?.enabled && documentId) {
      const captured = localStorage.getItem(`pagelink_lead_${documentId}`)
      if (captured) {
        setLeadCaptured(true)
      }
    }
  }, [leadCapture, documentId])

  // If document requires password and we don't have HTML yet
  if (hasPassword && !html) {
    return (
      <PasswordGate
        slug={slug}
        title={title}
        onSuccess={(unlockedHtml) => setHtml(unlockedHtml)}
      />
    )
  }

  // We have HTML - render the document
  if (!html) {
    return null
  }

  // Check if lead capture is required
  if (leadCapture?.enabled && !leadCaptured && documentId) {
    const handleLeadSubmit = async (data: LeadData) => {
      const response = await fetch(`/api/pagelink/documents/${documentId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit')
      }

      // Store in localStorage to bypass gate on future visits
      localStorage.setItem(`pagelink_lead_${documentId}`, 'true')
      setLeadCaptured(true)
    }

    // Generate preview HTML if enabled
    let previewHtml: string | undefined
    if (leadCapture.showPreview) {
      previewHtml = html
    }

    return (
      <EmailGate
        documentSlug={slug}
        documentTitle={title}
        config={leadCapture}
        onSubmit={handleLeadSubmit}
        previewHtml={previewHtml}
      />
    )
  }

  // Apply branding styles
  let processedHtml = html

  // Add branding styles
  if (branding) {
    const brandingStyles = getBrandingStyles(branding)
    processedHtml = processedHtml.replace('</head>', `${brandingStyles}</head>`)
  }

  // Add custom footer if configured
  if (branding?.footerText) {
    const footer = getCustomFooter(branding)
    processedHtml = processedHtml.replace('</body>', `${footer}</body>`)
  }

  // Add Pagelink badge if enabled
  if (showBadge) {
    processedHtml = processedHtml.replace('</body>', `${getPagelinkBadge()}</body>`)
  }

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={{ minHeight: '100vh' }}
      />
      {feedbackConfig?.enabled && documentId && (
        <FeedbackWidget
          documentId={documentId}
          documentSlug={slug}
          config={feedbackConfig}
        />
      )}
    </>
  )
}

function getBrandingStyles(branding: BrandingConfig): string {
  const fontImport = branding.fontFamily ? FONT_IMPORTS[branding.fontFamily] || '' : ''
  const fontFamily = branding.fontFamily ? FONT_FAMILIES[branding.fontFamily] || 'inherit' : 'inherit'
  const primary = branding.primaryColor || '#3B82F6'
  const accent = branding.accentColor || '#60A5FA'

  return `
<style>
  ${fontImport}

  /* Pagelink Branding Variables */
  :root {
    --pl-primary: ${primary};
    --pl-accent: ${accent};
    --pl-font: ${fontFamily};
  }

  /* Apply brand font to body */
  body {
    font-family: ${fontFamily};
  }

  /* Brand color for links */
  a {
    color: ${primary};
  }
  a:hover {
    color: ${accent};
  }

  /* Brand logo header */
  ${branding.logoUrl ? `
  .pagelink-brand-header {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 9999;
    padding: 8px 12px;
    background: rgba(255,255,255,0.9);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .pagelink-brand-header img {
    height: 28px;
    width: auto;
    display: block;
  }
  @media print {
    .pagelink-brand-header { display: none; }
  }
  ` : ''}

  /* Custom CSS */
  ${branding.customCss || ''}
</style>
${branding.logoUrl ? `
<div class="pagelink-brand-header">
  <img src="${branding.logoUrl}" alt="Logo" />
</div>
` : ''}
`
}

function getCustomFooter(branding: BrandingConfig): string {
  const primary = branding.primaryColor || '#3B82F6'
  const fontFamily = branding.fontFamily ? FONT_FAMILIES[branding.fontFamily] || 'inherit' : 'inherit'

  return `
<style>
  .pagelink-custom-footer {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(255,255,255,0.9);
    color: #333;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: ${fontFamily};
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 9998;
  }
  .pagelink-custom-footer a {
    color: ${primary};
    text-decoration: none;
  }
  .pagelink-custom-footer a:hover {
    text-decoration: underline;
  }
  @media print {
    .pagelink-custom-footer { display: none; }
  }
</style>
<div class="pagelink-custom-footer">
  ${branding.footerLink
    ? `<a href="${branding.footerLink}" target="_blank" rel="noopener noreferrer">${branding.footerText}</a>`
    : branding.footerText
  }
</div>
`
}

function getPagelinkBadge(): string {
  return `
<style>
  .pagelink-badge {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(15, 15, 15, 0.9);
    color: white;
    padding: 10px 16px;
    border-radius: 100px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .pagelink-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    background: rgba(59, 130, 246, 0.9);
  }
  .pagelink-badge svg {
    width: 16px;
    height: 16px;
  }
  @media print {
    .pagelink-badge { display: none; }
  }
</style>
<a href="https://pagelink.com" class="pagelink-badge" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
  Made with Pagelink
</a>`
}
