import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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
  is_public: boolean
  show_pagelink_badge: boolean
  password_hash: string | null
  expires_at: string | null
}

async function getDocument(slug: string): Promise<DocumentData | null> {
  const supabase = getAdminClient()

  if (!supabase) {
    // Demo mode
    if (slug.startsWith('bold-') || slug.startsWith('swift-') || slug.startsWith('demo')) {
      return {
        id: 'demo',
        slug,
        title: 'Demo Document',
        html: getDemoHtml(),
        is_public: true,
        show_pagelink_badge: true,
        password_hash: null,
        expires_at: null,
      }
    }
    return null
  }

  const { data: doc, error } = await supabase
    .from('pagelink_documents')
    .select('id, slug, title, html, is_public, show_pagelink_badge, password_hash, expires_at')
    .eq('slug', slug)
    .single()

  if (error || !doc) return null

  // Check if public and not password protected
  if (!doc.is_public || doc.password_hash) return null

  // Check if expired
  if (doc.expires_at && new Date(doc.expires_at) < new Date()) return null

  // Track embed view
  supabase.from('pagelink_analytics').insert({
    document_id: doc.id,
    event_type: 'embed_view',
    created_at: new Date().toISOString(),
  }).then(() => {})

  return doc as DocumentData
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = await getDocument(slug)

  if (!doc) {
    return { title: 'Document Not Found' }
  }

  return {
    title: doc.title,
    robots: { index: false, follow: false }, // Don't index embed pages
  }
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ badge?: string }>
}) {
  const { slug } = await params
  const { badge } = await searchParams

  const doc = await getDocument(slug)

  if (!doc) {
    notFound()
  }

  const showBadge = badge !== '0' && doc.show_pagelink_badge

  // Process HTML for embed - add embed-specific styles
  let processedHtml = doc.html

  // Add embed wrapper styles
  const embedStyles = `
<style>
  /* Embed-specific styles */
  html, body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  body {
    min-height: 100vh;
  }
  /* Adjust content for embedded view */
  .pagelink-embed-wrapper {
    padding: 20px;
  }
</style>
`

  // Add embed badge if enabled
  const embedBadge = showBadge ? `
<style>
  .pagelink-embed-badge {
    position: fixed;
    bottom: 12px;
    right: 12px;
    background: rgba(15, 15, 15, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 100px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    font-weight: 500;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .pagelink-embed-badge:hover {
    transform: translateY(-1px);
    background: rgba(59, 130, 246, 0.9);
  }
  .pagelink-embed-badge svg {
    width: 12px;
    height: 12px;
  }
</style>
<a href="https://pagelink.com" class="pagelink-embed-badge" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
  Pagelink
</a>
` : ''

  // Inject styles and badge
  processedHtml = processedHtml.replace('</head>', `${embedStyles}</head>`)
  processedHtml = processedHtml.replace('</body>', `${embedBadge}</body>`)

  return (
    <div
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      style={{ minHeight: '100vh' }}
    />
  )
}

function getDemoHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Document</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { margin-bottom: 1rem; color: #64748b; }
    .highlight { color: #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to <span class="highlight">Pagelink</span></h1>
    <p>This is a demo document showing embedded content. You can embed any Pagelink document on your website or blog.</p>
    <p>Embeds are responsive and look great on any device. Try resizing the embed to see it adapt!</p>
  </div>
</body>
</html>`
}
