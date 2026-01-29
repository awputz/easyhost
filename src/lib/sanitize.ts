// Input sanitization utilities for Pagelink
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize plain text input
 * Removes HTML tags and limits length
 */
export function sanitizeText(input: string, maxLength = 10000): string {
  if (!input) return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
}

/**
 * Sanitize a URL slug
 * Only allows lowercase letters, numbers, and hyphens
 */
export function sanitizeSlug(input: string, maxLength = 100): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .trim()
    .slice(0, maxLength)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Sanitize HTML content
 * Removes dangerous tags and attributes while preserving safe content
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize HTML content for document viewer (more permissive)
 * Allows iframes from trusted sources
 */
export function sanitizeDocumentHTML(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'style'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'srcdoc'],
    FORBID_TAGS: ['script', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: true,
  })
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input) return ''
  const email = input.trim().toLowerCase().slice(0, 254)
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? email : ''
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: string): string {
  if (!input) return ''
  const trimmed = input.trim().slice(0, 2000)

  try {
    const url = new URL(trimmed)
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }
    return url.href
  } catch {
    // If it doesn't start with a protocol, try adding https
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      try {
        const url = new URL(`https://${trimmed}`)
        return url.href
      } catch {
        return ''
      }
    }
    return ''
  }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(input: string, maxLength = 200): string {
  if (!input) return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"`;\\]/g, '')
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(input: string, maxLength = 255): string {
  if (!input) return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

/**
 * Sanitize JSON string
 * Parses and re-stringifies to ensure valid JSON
 */
export function sanitizeJSON(input: string): string | null {
  if (!input) return null
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

/**
 * Sanitize color hex code
 */
export function sanitizeColor(input: string): string {
  if (!input) return ''
  const color = input.trim()
  // Allow 3 or 6 character hex codes
  if (/^#[0-9A-Fa-f]{3}$/.test(color) || /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase()
  }
  return ''
}

/**
 * Escape HTML entities for safe text display
 */
export function escapeHtml(input: string): string {
  if (!input) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return input.replace(/[&<>"']/g, (char) => map[char])
}
