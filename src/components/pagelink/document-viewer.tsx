'use client'

import { useState } from 'react'
import { PasswordGate } from './password-gate'

interface DocumentViewerProps {
  slug: string
  title: string
  html: string | null
  hasPassword: boolean
  showBadge: boolean
}

export function DocumentViewer({
  slug,
  title,
  html: initialHtml,
  hasPassword,
  showBadge,
}: DocumentViewerProps) {
  const [html, setHtml] = useState(initialHtml)

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

  // Add Pagelink badge if enabled
  const htmlWithBadge = showBadge
    ? html.replace('</body>', `${getPagelinkBadge()}</body>`)
    : html

  return (
    <div
      dangerouslySetInnerHTML={{ __html: htmlWithBadge }}
      style={{ minHeight: '100vh' }}
    />
  )
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
