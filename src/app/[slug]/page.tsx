import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// Reserved slugs that shouldn't be used for documents
const RESERVED_SLUGS = [
  'api', 'dashboard', 'login', 'signup', 'create', 'pricing',
  'templates', 'settings', 'p', 'c', 'e', 't', 'help', 'docs'
]

// Use service role for public document serving
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface DocumentData {
  id: string
  slug: string
  title: string
  html: string
  theme: string
  custom_branding: Record<string, unknown>
  is_public: boolean
  show_pagelink_badge: boolean
  view_count: number
}

async function getDocument(slug: string): Promise<DocumentData | null> {
  // Check for reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return null
  }

  const supabase = getAdminClient()

  if (!supabase) {
    // Demo mode - return demo documents for certain slugs
    return getDemoDocument(slug)
  }

  const { data: doc, error } = await supabase
    .from('pagelink_documents')
    .select('id, slug, title, html, theme, custom_branding, is_public, show_pagelink_badge, view_count')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !doc) {
    // Fallback to demo
    return getDemoDocument(slug)
  }

  // Increment view count (fire and forget)
  supabase.rpc('increment_pagelink_view_count', { doc_slug: slug }).then(() => {})

  // Track analytics
  supabase.from('pagelink_analytics').insert({
    document_id: doc.id,
    event_type: 'view',
    created_at: new Date().toISOString(),
  }).then(() => {})

  return doc as DocumentData
}

function getDemoDocument(slug: string): DocumentData | null {
  // Return demo documents for demo slugs
  if (slug.startsWith('bold-') || slug.startsWith('swift-') || slug.startsWith('demo')) {
    return {
      id: 'demo',
      slug,
      title: 'Demo Document',
      html: getDemoHtml(),
      theme: 'midnight',
      custom_branding: {},
      is_public: true,
      show_pagelink_badge: true,
      view_count: 42,
    }
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  // Skip metadata for reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return {}
  }

  const doc = await getDocument(slug)

  if (!doc) {
    return { title: 'Document Not Found' }
  }

  return {
    title: doc.title,
    description: `View ${doc.title} on Pagelink`,
    openGraph: {
      title: doc.title,
      description: `View ${doc.title} on Pagelink`,
      type: 'article',
    },
  }
}

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Skip for reserved slugs (let Next.js handle 404)
  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  const doc = await getDocument(slug)

  if (!doc) {
    notFound()
  }

  // Add Pagelink badge if enabled
  const htmlWithBadge = doc.show_pagelink_badge
    ? doc.html.replace(
        '</body>',
        `${getPagelinkBadge()}</body>`
      )
    : doc.html

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{doc.title}</title>
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: htmlWithBadge }} />
      </body>
    </html>
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

function getDemoHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Document</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); color: #e5e5e5; line-height: 1.7; min-height: 100vh; padding: 60px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 400; margin-bottom: 1.5rem; text-align: center; }
    .highlight { background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; margin: 2rem 0; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 2rem 0; }
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 600; color: #3b82f6; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-top: 8px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; font-weight: 500; text-decoration: none; margin-top: 1rem; }
    p { margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="highlight">Welcome to Pagelink</span></h1>

    <div class="card" style="text-align: center;">
      <p style="font-size: 1.25rem;">This is a demo document showing what you can create with Pagelink.</p>
      <p style="opacity: 0.7;">Replace PDFs with beautiful, shareable web pages.</p>
    </div>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value">10x</div>
        <div class="stat-label">Faster Creation</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">∞</div>
        <div class="stat-label">Updates</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">Live</div>
        <div class="stat-label">Analytics</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 1rem;">What You Can Create</h2>
      <ul style="padding-left: 1.5rem;">
        <li>Investment Memoranda</li>
        <li>Pitch Decks</li>
        <li>Consulting Proposals</li>
        <li>Product One-Pagers</li>
        <li>Investor Updates</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 3rem;">
      <a href="/create" class="cta">Create Your Own →</a>
    </div>
  </div>
</body>
</html>`
}
